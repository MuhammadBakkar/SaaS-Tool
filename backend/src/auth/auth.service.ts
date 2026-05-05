import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Request } from "express";
import { AuthProvider, UserStatus } from "@prisma/client";
import { getPrisma } from "../lib/prisma.js";
import {
  accessRemainingTtlSeconds,
  newJti,
  refreshTtlSeconds,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { encryptSecret } from "../lib/cryptoTokens.js";
import { redisSetWithTtl } from "../lib/redis.js";
import { writeAuditLog } from "../common/audit/audit.service.js";
import * as mail from "../mail/mail.service.js";
import { getClientIp } from "../common/http/clientIp.js";
import { AppError } from "../utils/errorHandler.js";
import { HTTP_STATUS } from "../utils/response.js";
import { findUserByResetToken, findUserByVerifyToken } from "../users/users.service.js";
import type { GoogleUser } from "./auth.types.js";

export type { GoogleUser } from "./auth.types.js";

const BCRYPT_ROUNDS = 12;

async function createSessionAndTokens(input: {
  userId: string;
  email: string;
  rememberMe: boolean;
  ip?: string | undefined;
  device?: string | undefined;
}): Promise<{ access_token: string; refresh_token: string }> {
  const prisma = getPrisma();
  const accessJti = newJti();
  const sessionId = randomUUID();
  const refreshJwt = signRefreshToken(input.userId, sessionId, input.rememberMe);
  const refreshHash = await bcrypt.hash(refreshJwt, BCRYPT_ROUNDS);
  const ttlSec = refreshTtlSeconds(input.rememberMe);
  const expiresAt = new Date(Date.now() + ttlSec * 1000);

  await prisma.userSession.create({
    data: {
      id: sessionId,
      user_id: input.userId,
      refresh_token: refreshHash,
      access_token_jti: accessJti,
      device_info: input.device ?? null,
      ip_address: input.ip ?? null,
      expires_at: expiresAt,
    },
  });

  return {
    access_token: signAccessToken(input.userId, input.email, accessJti, sessionId),
    refresh_token: refreshJwt,
  };
}

export async function register(dto: {
  full_name: string;
  email: string;
  password: string;
}): Promise<{ message: string }> {
  const prisma = getPrisma();
  const email = dto.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("Email already registered", HTTP_STATUS.CONFLICT);
  }

  const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
  const email_verify_token = randomBytes(32).toString("hex");
  const email_verify_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email,
        full_name: dto.full_name,
        password_hash,
        status: UserStatus.unverified,
        email_verify_token,
        email_verify_expires,
        auth_provider: AuthProvider.email,
      },
      select: { id: true, email: true, full_name: true },
    });
    await tx.userPlan.create({
      data: {
        user_id: u.id,
        plan_name: "free",
        credits_total: 5,
        credits_used: 0,
      },
    });
    return u;
  });

  const base = process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const verifyLink = `${base}/verify-email?token=${encodeURIComponent(email_verify_token)}`;

  await mail.sendVerificationEmail(user.email, user.full_name, verifyLink);
  await writeAuditLog({
    user_id: user.id,
    action: "user_registered",
    entity_type: "users",
    entity_id: user.id,
    metadata: { channel: "email" },
  });

  return { message: "Check your email to verify your account" };
}

export async function verifyEmail(
  token: string,
  req: Request
): Promise<{ access_token: string; refresh_token: string }> {
  const prisma = getPrisma();
  const user = await findUserByVerifyToken(token);
  if (!user || !user.email_verify_expires) {
    throw new AppError("Invalid or expired token", HTTP_STATUS.BAD_REQUEST);
  }
  if (user.email_verify_expires.getTime() < Date.now()) {
    throw new AppError("Invalid or expired token", HTTP_STATUS.BAD_REQUEST);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      status: UserStatus.active,
      email_verify_token: null,
      email_verify_expires: null,
    },
  });

  await writeAuditLog({
    user_id: user.id,
    action: "email_verified",
    entity_type: "users",
    entity_id: user.id,
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  await mail.sendWelcomeEmail(user.email, user.full_name).catch(() => {});

  const ip = getClientIp(req);
  const device = req.headers["user-agent"]?.slice(0, 500);
  return createSessionAndTokens({
    userId: user.id,
    email: user.email,
    rememberMe: false,
    ...(ip !== undefined ? { ip } : {}),
    ...(device !== undefined ? { device } : {}),
  });
}

export async function login(
  dto: { email: string; password: string; remember_me?: boolean },
  req: Request
): Promise<{
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    plan: { plan_name: string; credits_used: number; credits_total: number } | null;
  };
}> {
  const prisma = getPrisma();
  const email = dto.email.toLowerCase();
  const ip = getClientIp(req);
  const uaRaw = req.headers["user-agent"];
  const ua =
    typeof uaRaw === "string" && uaRaw.length > 0
      ? uaRaw.slice(0, 500)
      : undefined;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
      password_hash: true,
      status: true,
      email_verified: true,
    },
  });

  const fail = async (reason: string, userId?: string | null) => {
    await writeAuditLog({
      user_id: userId ?? null,
      action: "user_login",
      ip_address: ip ?? null,
      user_agent: ua ?? null,
      metadata: { success: false, reason },
    });
  };

  if (!user || !user.password_hash) {
    await fail("invalid_password", user?.id);
    throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
  }
  if (user.status !== UserStatus.active || !user.email_verified) {
    await fail("account_inactive", user.id);
    throw new AppError("Account is inactive", HTTP_STATUS.UNAUTHORIZED);
  }

  const ok = await bcrypt.compare(dto.password, user.password_hash);
  if (!ok) {
    await fail("invalid_password", user.id);
    throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date(), last_login_ip: ip ?? null },
  });

  const rememberMe = Boolean(dto.remember_me);
  const tokens = await createSessionAndTokens({
    userId: user.id,
    email: user.email,
    rememberMe,
    ...(ip !== undefined ? { ip } : {}),
    ...(ua !== undefined ? { device: ua } : {}),
  });

  const plan = await prisma.userPlan.findUnique({
    where: { user_id: user.id },
    select: { plan_name: true, credits_used: true, credits_total: true },
  });

  await writeAuditLog({
    user_id: user.id,
    action: "user_login",
    ip_address: ip ?? null,
    user_agent: ua ?? null,
    metadata: { success: true },
  });

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      plan: plan
        ? {
            plan_name: plan.plan_name,
            credits_used: plan.credits_used,
            credits_total: plan.credits_total,
          }
        : null,
    },
  };
}

export async function finishGoogleLogin(
  g: GoogleUser,
  req: Request
): Promise<string> {
  const prisma = getPrisma();
  const ip = getClientIp(req);
  const uaRaw = req.headers["user-agent"];
  const ua =
    typeof uaRaw === "string" && uaRaw.length > 0
      ? uaRaw.slice(0, 500)
      : undefined;
  const front = process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  if (!g.email) {
    throw new AppError("Google did not return an email", HTTP_STATUS.BAD_REQUEST);
  }

  const email = g.email.toLowerCase();
  const fullName = [g.firstName, g.lastName].filter(Boolean).join(" ").trim() || null;

  const existingOauth = await prisma.oauthAccount.findUnique({
    where: {
      provider_provider_user_id: { provider: "google", provider_user_id: g.googleId },
    },
    include: { user: { include: { plan: true } } },
  });

  let userId: string;
  let userEmail: string;
  let isNew = false;

  if (existingOauth) {
    userId = existingOauth.user_id;
    userEmail = existingOauth.user.email;
    await prisma.oauthAccount.update({
      where: { id: existingOauth.id },
      data: {
        access_token: encryptSecret(g.accessToken),
        refresh_token: g.refreshToken ? encryptSecret(g.refreshToken) : null,
        token_expires_at: null,
        raw_profile: JSON.stringify({ picture: g.picture }),
      },
    });
    const userUpdate: {
      google_id: string;
      last_login_at: Date;
      last_login_ip: string | null;
      avatar_url?: string | null;
    } = {
      google_id: g.googleId,
      last_login_at: new Date(),
      last_login_ip: ip ?? null,
    };
    if (g.picture !== undefined) {
      userUpdate.avatar_url = g.picture;
    }
    await prisma.user.update({
      where: { id: userId },
      data: userUpdate,
    });
  } else {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      userId = byEmail.id;
      userEmail = byEmail.email;
      await prisma.$transaction([
        prisma.user.update({
          where: { id: byEmail.id },
          data: { google_id: g.googleId, avatar_url: g.picture ?? byEmail.avatar_url },
        }),
        prisma.oauthAccount.create({
          data: {
            user_id: byEmail.id,
            provider: "google",
            provider_user_id: g.googleId,
            access_token: encryptSecret(g.accessToken),
            refresh_token: g.refreshToken ? encryptSecret(g.refreshToken) : null,
            raw_profile: JSON.stringify({ picture: g.picture }),
          },
        }),
      ]);
      await writeAuditLog({
        user_id: userId,
        action: "oauth_connected",
        entity_type: "oauth_accounts",
        entity_id: g.googleId,
        ip_address: ip ?? null,
        user_agent: ua ?? null,
      });
    } else {
      isNew = true;
      const created = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email,
            full_name: fullName,
            avatar_url: g.picture ?? null,
            auth_provider: AuthProvider.google,
            google_id: g.googleId,
            status: UserStatus.active,
            email_verified: true,
          },
          select: { id: true, email: true },
        });
        await tx.userPlan.create({
          data: { user_id: u.id, plan_name: "free", credits_total: 5, credits_used: 0 },
        });
        await tx.oauthAccount.create({
          data: {
            user_id: u.id,
            provider: "google",
            provider_user_id: g.googleId,
            access_token: encryptSecret(g.accessToken),
            refresh_token: g.refreshToken ? encryptSecret(g.refreshToken) : null,
            raw_profile: JSON.stringify({ picture: g.picture }),
          },
        });
        return u;
      });
      userId = created.id;
      userEmail = created.email;
      await writeAuditLog({
        user_id: userId,
        action: "user_registered",
        entity_type: "users",
        entity_id: userId,
        ip_address: ip ?? null,
        user_agent: ua ?? null,
        metadata: { channel: "google" },
      });
    }
  }

  const tokens = await createSessionAndTokens({
    userId,
    email: userEmail,
    rememberMe: false,
    ...(ip !== undefined ? { ip } : {}),
    ...(ua !== undefined ? { device: ua } : {}),
  });

  await writeAuditLog({
    user_id: userId,
    action: "user_login",
    ip_address: ip ?? null,
    user_agent: ua ?? null,
    metadata: { success: true, via: "google", new_user: isNew },
  });

  const q = new URLSearchParams({
    token: tokens.access_token,
    refresh: tokens.refresh_token,
  });
  return `${front}/auth/callback?${q.toString()}`;
}

export async function refreshToken(refreshJwt: string): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const payload = verifyRefreshToken(refreshJwt);
  const prisma = getPrisma();
  const session = await prisma.userSession.findUnique({
    where: { id: payload.sid },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!session || !session.is_active || session.expires_at.getTime() < Date.now()) {
    throw new AppError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
  }
  const same = await bcrypt.compare(refreshJwt, session.refresh_token);
  if (!same) {
    throw new AppError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
  }

  const newAccessJti = newJti();
  const msLeft = session.expires_at.getTime() - Date.now();
  const rememberMe =
    msLeft > refreshTtlSeconds(false) * 1000 * 0.85;
  const newRefreshJwt = signRefreshToken(session.user_id, session.id, rememberMe);
  const newRefreshHash = await bcrypt.hash(newRefreshJwt, BCRYPT_ROUNDS);
  const ttlSec = refreshTtlSeconds(rememberMe);
  const newExpires = new Date(Date.now() + ttlSec * 1000);

  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      refresh_token: newRefreshHash,
      access_token_jti: newAccessJti,
      expires_at: newExpires,
    },
  });

  return {
    access_token: signAccessToken(
      session.user_id,
      session.user.email,
      newAccessJti,
      session.id
    ),
    refresh_token: newRefreshJwt,
  };
}

export async function logout(accessToken: string, userId: string): Promise<{ message: string }> {
  const access = verifyAccessToken(accessToken);
  if (access.sub !== userId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  const prisma = getPrisma();
  const session = await prisma.userSession.findFirst({
    where: { user_id: userId, access_token_jti: access.jti, is_active: true },
  });
  if (!session) {
    throw new AppError("Session not found", HTTP_STATUS.NOT_FOUND);
  }
  await prisma.userSession.update({
    where: { id: session.id },
    data: { is_active: false },
  });
  const ttl = accessRemainingTtlSeconds(accessToken);
  await redisSetWithTtl(`bl:jti:${access.jti}`, "1", ttl);
  await writeAuditLog({
    user_id: userId,
    action: "user_logout",
    entity_type: "user_sessions",
    entity_id: session.id,
  });
  return { message: "Logged out successfully" };
}

export async function logoutAll(userId: string): Promise<{ message: string }> {
  const prisma = getPrisma();
  await prisma.userSession.updateMany({
    where: { user_id: userId, is_active: true },
    data: { is_active: false },
  });
  await writeAuditLog({
    user_id: userId,
    action: "user_logout_all_devices",
    entity_type: "users",
    entity_id: userId,
  });
  return { message: "Logged out from all devices" };
}

export async function forgotPassword(
  email: string,
  req: Request
): Promise<{ message: string }> {
  const prisma = getPrisma();
  const normalized = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  const msg = { message: "If that email exists, a reset link has been sent" };

  if (!user) {
    return msg;
  }

  const reset_token = randomBytes(32).toString("hex");
  const reset_token_expires = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: { reset_token, reset_token_expires },
  });

  const base = process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const link = `${base}/reset-password?token=${encodeURIComponent(reset_token)}`;
  await mail.sendPasswordResetEmail(user.email, user.full_name, link);
  await writeAuditLog({
    user_id: user.id,
    action: "password_reset_requested",
    entity_type: "users",
    entity_id: user.id,
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  return msg;
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  const prisma = getPrisma();
  const user = await findUserByResetToken(token);
  if (!user?.reset_token_expires) {
    throw new AppError("Invalid or expired token", HTTP_STATUS.BAD_REQUEST);
  }
  if (user.reset_token_expires.getTime() < Date.now()) {
    throw new AppError("Invalid or expired token", HTTP_STATUS.BAD_REQUEST);
  }

  const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        reset_token: null,
        reset_token_expires: null,
      },
    }),
    prisma.userSession.updateMany({
      where: { user_id: user.id, is_active: true },
      data: { is_active: false },
    }),
  ]);

  await writeAuditLog({
    user_id: user.id,
    action: "password_reset_completed",
    entity_type: "users",
    entity_id: user.id,
  });

  return { message: "Password reset successful. Please login again." };
}

export async function getCurrentUser(userId: string, accessJwt?: string | null) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
      auth_provider: true,
      plan: {
        select: {
          plan_name: true,
          credits_used: true,
          credits_total: true,
          status: true,
        },
      },
    },
  });
  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }
  let current_session_id: string | null = null;
  if (accessJwt) {
    try {
      const { jti } = verifyAccessToken(accessJwt);
      const s = await prisma.userSession.findFirst({
        where: { user_id: userId, access_token_jti: jti, is_active: true },
        select: { id: true },
      });
      current_session_id = s?.id ?? null;
    } catch {
      current_session_id = null;
    }
  }
  return { ...user, current_session_id };
}

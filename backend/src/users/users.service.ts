import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Request } from "express";
import { UserStatus } from "@prisma/client";
import { getPrisma } from "../lib/prisma.js";
import { getClientIp } from "../common/http/clientIp.js";
import { writeAuditLog } from "../common/audit/audit.service.js";
import * as mail from "../mail/mail.service.js";
import { uploadAvatar, deleteAvatar } from "../upload/upload.service.js";
import { AppError } from "../utils/errorHandler.js";
import { HTTP_STATUS } from "../utils/response.js";

const BCRYPT_ROUNDS = 12;

type UpdateProfileBody = {
  full_name?: string;
  timezone?: string;
  locale?: string;
};

/** Registration email verification only (not email-change tokens). */
export async function findUserByVerifyToken(token: string) {
  return getPrisma().user.findFirst({
    where: { email_verify_token: token, pending_email: null },
    select: {
      id: true,
      email: true,
      full_name: true,
      email_verify_expires: true,
    },
  });
}

export async function findUserByResetToken(token: string) {
  return getPrisma().user.findFirst({
    where: { reset_token: token },
    select: { id: true, reset_token_expires: true },
  });
}

export async function getProfile(userId: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
      auth_provider: true,
      status: true,
      email_verified: true,
      timezone: true,
      locale: true,
      pending_email: true,
      last_login_at: true,
      last_login_ip: true,
      created_at: true,
      plan: {
        select: {
          plan_name: true,
          credits_used: true,
          credits_total: true,
          status: true,
          current_period_start: true,
          current_period_end: true,
        },
      },
    },
  });
  if (!user || user.status === UserStatus.deleted) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }
  return user;
}

export async function updateProfile(userId: string, body: UpdateProfileBody, req: Request) {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: { id: true, status: true },
  });
  if (!user || user.status === UserStatus.deleted) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  const data: Record<string, unknown> = {};
  if (body.full_name !== undefined) data.full_name = body.full_name;
  if (body.timezone !== undefined) data.timezone = body.timezone;
  if (body.locale !== undefined) data.locale = body.locale;

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
      timezone: true,
      locale: true,
    },
  });

  await writeAuditLog({
    user_id: userId,
    action: "profile_updated",
    entity_type: "users",
    entity_id: userId,
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  return updated;
}

export async function uploadUserAvatar(userId: string, file: Express.Multer.File, req: Request) {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: { id: true, status: true },
  });
  if (!user || user.status === UserStatus.deleted) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  const avatar_url = await uploadAvatar(file, userId);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatar_url },
    select: { id: true, avatar_url: true },
  });

  await writeAuditLog({
    user_id: userId,
    action: "profile_updated",
    entity_type: "users",
    entity_id: userId,
    metadata: { field: "avatar_url" },
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  return updated;
}

export async function removeUserAvatar(userId: string, req: Request) {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: { id: true, status: true },
  });
  if (!user || user.status === UserStatus.deleted) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  await deleteAvatar(userId);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatar_url: null },
    select: { id: true, avatar_url: true },
  });

  await writeAuditLog({
    user_id: userId,
    action: "profile_updated",
    entity_type: "users",
    entity_id: userId,
    metadata: { field: "avatar_url", removed: true },
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  return updated;
}

export async function changePassword(
  userId: string,
  body: { current_password: string; new_password: string; confirm_password: string },
  currentSessionId: string,
  req: Request
) {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: { id: true, password_hash: true, status: true },
  });
  if (!user || user.status === UserStatus.deleted) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }
  if (!user.password_hash) {
    throw new AppError("Password login is not enabled for this account", HTTP_STATUS.BAD_REQUEST);
  }

  const ok = await bcrypt.compare(body.current_password, user.password_hash);
  if (!ok) {
    throw new AppError("Current password is incorrect", HTTP_STATUS.UNAUTHORIZED);
  }

  const password_hash = await bcrypt.hash(body.new_password, BCRYPT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    }),
    prisma.userSession.updateMany({
      where: { user_id: userId, is_active: true, id: { not: currentSessionId } },
      data: { is_active: false },
    }),
  ]);

  await writeAuditLog({
    user_id: userId,
    action: "password_changed",
    entity_type: "users",
    entity_id: userId,
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  return { message: "Password updated" };
}

export async function getActiveSessions(userId: string, currentSessionId: string) {
  const prisma = getPrisma();
  const sessions = await prisma.userSession.findMany({
    where: {
      user_id: userId,
      is_active: true,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      device_info: true,
      ip_address: true,
      created_at: true,
      expires_at: true,
    },
  });
  return sessions.map((s) => ({
    ...s,
    is_current: s.id === currentSessionId,
  }));
}

export async function revokeAllOtherSessions(
  userId: string,
  currentSessionId: string,
  req: Request
) {
  const prisma = getPrisma();
  const result = await prisma.userSession.updateMany({
    where: { user_id: userId, is_active: true, id: { not: currentSessionId } },
    data: { is_active: false },
  });

  await writeAuditLog({
    user_id: userId,
    action: "user_logout_all_devices",
    entity_type: "users",
    entity_id: userId,
    metadata: { revoked_other_sessions: result.count },
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  return { message: "Other sessions signed out", count: result.count };
}

export async function revokeSession(
  userId: string,
  targetSessionId: string,
  currentSessionId: string,
  req: Request
) {
  if (targetSessionId === currentSessionId) {
    throw new AppError("Cannot revoke the current session from here", HTTP_STATUS.BAD_REQUEST);
  }
  const prisma = getPrisma();
  const session = await prisma.userSession.findFirst({
    where: { id: targetSessionId, user_id: userId },
  });
  if (!session) {
    throw new AppError("Session not found", HTTP_STATUS.NOT_FOUND);
  }
  await prisma.userSession.update({
    where: { id: targetSessionId },
    data: { is_active: false },
  });

  await writeAuditLog({
    user_id: userId,
    action: "user_logout",
    entity_type: "user_sessions",
    entity_id: targetSessionId,
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  return { message: "Session revoked" };
}

export async function requestEmailChange(
  userId: string,
  body: { new_email: string; password?: string },
  req: Request
) {
  const prisma = getPrisma();
  const newEmail = body.new_email.toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: {
      id: true,
      email: true,
      full_name: true,
      password_hash: true,
      auth_provider: true,
      status: true,
    },
  });
  if (!user || user.status === UserStatus.deleted) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  if (user.email === newEmail) {
    throw new AppError("That is already your email", HTTP_STATUS.BAD_REQUEST);
  }

  const taken = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
  if (taken) {
    throw new AppError("Email is already in use", HTTP_STATUS.CONFLICT);
  }

  if (user.password_hash) {
    if (!body.password) {
      throw new AppError("Password is required to change email", HTTP_STATUS.BAD_REQUEST);
    }
    const ok = await bcrypt.compare(body.password, user.password_hash);
    if (!ok) {
      throw new AppError("Invalid password", HTTP_STATUS.UNAUTHORIZED);
    }
  }

  const email_verify_token = randomBytes(32).toString("hex");
  const email_verify_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      pending_email: newEmail,
      email_verify_token,
      email_verify_expires,
    },
  });

  const base = process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const confirmLink = `${base}/verify-email-change?token=${encodeURIComponent(email_verify_token)}`;

  await mail.sendEmailChangeConfirmation(newEmail, user.full_name, confirmLink);
  await mail.sendEmailChangeAlertToCurrent(user.email, user.full_name, newEmail).catch(() => {});

  await writeAuditLog({
    user_id: userId,
    action: "email_change_requested",
    entity_type: "users",
    entity_id: userId,
    metadata: { new_email: newEmail },
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  return { message: "Check the new inbox to confirm your email change" };
}

export async function verifyEmailChange(
  userId: string,
  body: { token: string },
  req: Request
) {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      email_verify_token: body.token,
      pending_email: { not: null },
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      pending_email: true,
      email_verify_expires: true,
      status: true,
    },
  });
  if (!user?.pending_email || !user.email_verify_expires) {
    throw new AppError("Invalid or expired token", HTTP_STATUS.BAD_REQUEST);
  }
  if (user.email_verify_expires.getTime() < Date.now()) {
    throw new AppError("Invalid or expired token", HTTP_STATUS.BAD_REQUEST);
  }

  const newEmail = user.pending_email.toLowerCase();

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: newEmail,
      pending_email: null,
      email_verify_token: null,
      email_verify_expires: null,
    },
  });

  await writeAuditLog({
    user_id: userId,
    action: "email_changed",
    entity_type: "users",
    entity_id: userId,
    metadata: { previous_email: user.email, new_email: newEmail },
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  return { message: "Email updated successfully" };
}

export async function getPlanSummary(userId: string) {
  const prisma = getPrisma();
  const plan = await prisma.userPlan.findUnique({
    where: { user_id: userId },
    select: {
      plan_name: true,
      status: true,
      credits_used: true,
      credits_total: true,
      current_period_start: true,
      current_period_end: true,
    },
  });
  if (!plan) {
    return {
      plan_name: "free" as const,
      status: "active" as const,
      credits_used: 0,
      credits_total: 5,
      current_period_start: null,
      current_period_end: null,
    };
  }
  return plan;
}

export async function deleteAccount(
  userId: string,
  body: { password?: string; confirmation?: string },
  req: Request
) {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: {
      id: true,
      email: true,
      password_hash: true,
      status: true,
    },
  });
  if (!user || user.status === UserStatus.deleted) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  if (user.password_hash) {
    if (!body.password) {
      throw new AppError("Password is required to delete this account", HTTP_STATUS.BAD_REQUEST);
    }
    const ok = await bcrypt.compare(body.password, user.password_hash);
    if (!ok) {
      throw new AppError("Invalid password", HTTP_STATUS.UNAUTHORIZED);
    }
  } else {
    const c = body.confirmation?.trim().toUpperCase();
    if (c !== "DELETE") {
      throw new AppError('Type "DELETE" in the confirmation field to delete this account', HTTP_STATUS.BAD_REQUEST);
    }
  }

  await deleteAvatar(userId).catch(() => {});

  await prisma.$transaction([
    prisma.userSession.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.deleted,
        deleted_at: new Date(),
        email: `deleted_${user.id}@invalid.local`,
        google_id: null,
        password_hash: null,
        pending_email: null,
        email_verify_token: null,
        email_verify_expires: null,
        reset_token: null,
        reset_token_expires: null,
        avatar_url: null,
      },
    }),
  ]);

  await writeAuditLog({
    user_id: userId,
    action: "account_deleted",
    entity_type: "users",
    entity_id: userId,
    ip_address: getClientIp(req) ?? null,
    user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  });

  return { message: "Account deleted" };
}

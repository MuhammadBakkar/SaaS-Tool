import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export type AccessPayload = {
  sub: string;
  email: string;
  jti: string;
  /** Present on newly issued access tokens; older tokens may omit it. */
  sessionId?: string;
  typ: "access";
};
export type RefreshPayload = { sub: string; sid: string; typ: "refresh" };

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function parseDurationToSeconds(expr: string): number {
  const m = /^(\d+)(s|m|h|d)$/i.exec(expr.trim());
  if (!m || !m[1] || !m[2]) return 900;
  const n = Number.parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  switch (u) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    default:
      return 900;
  }
}

export function accessTtlSeconds(): number {
  return parseDurationToSeconds(process.env.JWT_ACCESS_EXPIRES_IN ?? "15m");
}

export function refreshTtlSeconds(rememberMe: boolean): number {
  if (rememberMe) {
    return parseDurationToSeconds(process.env.JWT_REFRESH_REMEMBER_EXPIRES_IN ?? "90d");
  }
  return parseDurationToSeconds(process.env.JWT_REFRESH_EXPIRES_IN ?? "30d");
}

export function signAccessToken(
  userId: string,
  email: string,
  jti: string,
  sessionId: string
): string {
  const secret = requireEnv("JWT_ACCESS_SECRET");
  return jwt.sign(
    { sub: userId, email, jti, sessionId, typ: "access" },
    secret,
    {
      expiresIn: accessTtlSeconds(),
    }
  );
}

export function signRefreshToken(
  userId: string,
  sessionId: string,
  rememberMe: boolean
): string {
  const secret = requireEnv("JWT_REFRESH_SECRET");
  const seconds = refreshTtlSeconds(rememberMe);
  return jwt.sign({ sub: userId, sid: sessionId, typ: "refresh" }, secret, {
    expiresIn: seconds,
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  const secret = requireEnv("JWT_ACCESS_SECRET");
  const decoded = jwt.verify(token, secret) as AccessPayload;
  if (decoded.typ !== "access") throw new Error("Invalid token type");
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const secret = requireEnv("JWT_REFRESH_SECRET");
  const decoded = jwt.verify(token, secret) as RefreshPayload;
  if (decoded.typ !== "refresh") throw new Error("Invalid token type");
  return decoded;
}

export function newJti(): string {
  return randomUUID();
}

export function accessRemainingTtlSeconds(token: string): number {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) return accessTtlSeconds();
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - now);
}

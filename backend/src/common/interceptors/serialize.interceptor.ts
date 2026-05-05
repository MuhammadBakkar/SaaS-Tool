import type { NextFunction, Request, Response } from "express";

/** Do not include `refresh_token` here — login / refresh / verify-email must return it to the client for the Next.js cookie route. */
const SENSITIVE_KEYS = new Set([
  "password_hash",
  "reset_token",
  "email_verify_token",
  "access_token_jti",
  "reset_token_expires",
  "email_verify_expires",
  "google_id",
  "encryption_key",
]);

function stripSensitive(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripSensitive(item));
  }
  if (typeof value === "object" && value.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) {
        continue;
      }
      out[k] = stripSensitive(v);
    }
    return out;
  }
  return value;
}

/** Removes sensitive keys from JSON bodies before they are sent to clients. */
export function serializeResponseMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json.bind(res) as Response["json"];
  res.json = function jsonSanitized(this: Response, body?: unknown) {
    return originalJson.call(this, stripSensitive(body) as typeof body);
  };
  next();
}

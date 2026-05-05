import type { Request } from "express";

/** Same idea as Nest `@CurrentUser()` — read `req.user` after JWT middleware. */
export function getCurrentUser(req: Request) {
  return req.user ?? null;
}

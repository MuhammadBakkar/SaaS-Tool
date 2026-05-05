import type { NextFunction, Request, Response } from "express";

/** Placeholder for a global audit interceptor; auth flows already write `audit_logs` in services. */
export function auditLogInterceptor(_req: Request, _res: Response, next: NextFunction) {
  next();
}

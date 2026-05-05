import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { errorResponse, HTTP_STATUS } from "../../utils/response.js";

/** Express middleware: parse `req.body` with a Zod schema; respond 400 on failure. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.errors[0];
      const message = first?.message ?? "Invalid request body";
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse(message, HTTP_STATUS.BAD_REQUEST, result.error.message));
      return;
    }
    req.body = result.data;
    next();
  };
}

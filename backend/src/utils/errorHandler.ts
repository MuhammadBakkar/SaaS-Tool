import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import {
  errorResponse,
  HTTP_STATUS,
  ERROR_MESSAGES,
} from "./response.js";

// Custom Error Class
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Global Error Handling Middleware
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error("❌ Error:", {
    message: err.message,
    statusCode: err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      errorResponse(err.message, err.statusCode)
    );
  }

  // Handle Prisma errors
  if (err.code === "P2002") {
    return res.status(HTTP_STATUS.CONFLICT).json(
      errorResponse(ERROR_MESSAGES.DUPLICATE_ENTRY, HTTP_STATUS.CONFLICT)
    );
  }

  if (err.code === "P2025") {
    return res.status(HTTP_STATUS.NOT_FOUND).json(
      errorResponse(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    );
  }

  if (err.code?.startsWith("P")) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.DATABASE_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  // Default error response
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    errorResponse(
      process.env.NODE_ENV === "development" 
        ? err.message 
        : ERROR_MESSAGES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  );
}

// 404 Handler Middleware
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(HTTP_STATUS.NOT_FOUND).json(
    errorResponse(
      `Route ${req.method} ${req.path} not found`,
      HTTP_STATUS.NOT_FOUND
    )
  );
}

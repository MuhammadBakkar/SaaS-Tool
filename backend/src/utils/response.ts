// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// API Response Types
export interface ApiResponse<T = null> {
  status: number;
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  error?: string;
  data?: null;
}

// Success Response Builder
export function successResponse<T>(
  message: string,
  data?: T,
  statusCode: number = HTTP_STATUS.OK
): ApiResponse<T> {
  return {
    status: statusCode,
    message,
    ...(data !== undefined && { data }),
  };
}

// Error Response Builder
export function errorResponse(
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  error?: string
): ApiErrorResponse {
  return {
    status: statusCode,
    message,
    ...(error && { error }),
    data: null,
  };
}

// Error Handler Middleware
export function handleApiError(err: any, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";

  return errorResponse(message, statusCode, err instanceof Error ? err.stack : undefined);
}

// Common Error Messages
export const ERROR_MESSAGES = {
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access forbidden",
  INVALID_INPUT: "Invalid input provided",
  DUPLICATE_ENTRY: "Duplicate entry",
  DATABASE_ERROR: "Database operation failed",
  INTERNAL_ERROR: "Internal server error",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  MISSING_FIELDS: "Required fields are missing",
} as const;

// Common Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  FETCHED: "Resource fetched successfully",
  OPERATION_SUCCESS: "Operation completed successfully",
} as const;

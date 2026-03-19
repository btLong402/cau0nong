/**
 * Domain Error Classes for API Responses
 * All errors include HTTP status mapping and trace ID for debugging
 */

export enum ErrorCode {
  // Validation errors
  ERR_VALIDATION = "ERR_VALIDATION",
  ERR_INVALID_REQUEST = "ERR_INVALID_REQUEST",

  // Auth errors
  ERR_UNAUTHENTICATED = "ERR_UNAUTHENTICATED",
  ERR_FORBIDDEN = "ERR_FORBIDDEN",
  ERR_INVALID_CREDENTIALS = "ERR_INVALID_CREDENTIALS",

  // Resource errors
  ERR_NOT_FOUND = "ERR_NOT_FOUND",
  ERR_CONFLICT = "ERR_CONFLICT",
  ERR_RESOURCE_EXISTS = "ERR_RESOURCE_EXISTS",

  // Server errors
  ERR_SERVER = "ERR_SERVER",
  ERR_INTERNAL = "ERR_INTERNAL",
  ERR_SERVICE_UNAVAILABLE = "ERR_SERVICE_UNAVAILABLE",

  // Business logic errors
  ERR_INVALID_STATE = "ERR_INVALID_STATE",
  ERR_OPERATION_NOT_ALLOWED = "ERR_OPERATION_NOT_ALLOWED",
}

/**
 * Base API Error class
 * All domain errors extend this
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly traceId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>,
    traceId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.traceId = traceId;

    // Maintain prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Validation Error (400 Bad Request)
 * Used when request body/params fail schema validation
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, unknown>,
    traceId?: string
  ) {
    super(
      ErrorCode.ERR_VALIDATION,
      message || "Dữ liệu yêu cầu không hợp lệ",
      400,
      details,
      traceId
    );
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication Error (401 Unauthorized)
 * Used when user is not authenticated
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = "Yêu cầu đăng nhập", traceId?: string) {
    super(
      ErrorCode.ERR_UNAUTHENTICATED,
      message,
      401,
      undefined,
      traceId
    );
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization Error (403 Forbidden)
 * Used when user lacks permission for the action
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = "Bạn không có quyền truy cập", traceId?: string) {
    super(
      ErrorCode.ERR_FORBIDDEN,
      message,
      403,
      undefined,
      traceId
    );
    this.name = "AuthorizationError";
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not Found Error (404 Not Found)
 * Used when requested resource does not exist
 */
export class NotFoundError extends ApiError {
  constructor(
    resourceType: string = "Resource",
    traceId?: string
  ) {
    super(
      ErrorCode.ERR_NOT_FOUND,
      `Không tìm thấy ${resourceType}`,
      404,
      undefined,
      traceId
    );
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict Error (409 Conflict)
 * Used when resource already exists or state conflicts
 */
export class ConflictError extends ApiError {
  constructor(
    message: string = "Dữ liệu đã tồn tại",
    details?: Record<string, unknown>,
    traceId?: string
  ) {
    super(
      ErrorCode.ERR_CONFLICT,
      message,
      409,
      details,
      traceId
    );
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Invalid State Error (422 Unprocessable Entity)
 * Used when operation violates business logic constraints
 */
export class InvalidStateError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, unknown>,
    traceId?: string
  ) {
    super(
      ErrorCode.ERR_INVALID_STATE,
      message,
      422,
      details,
      traceId
    );
    this.name = "InvalidStateError";
    Object.setPrototypeOf(this, InvalidStateError.prototype);
  }
}

/**
 * Server Error (500 Internal Server Error)
 * Used for unexpected server-side failures
 */
export class ServerError extends ApiError {
  constructor(message: string = "Lỗi máy chủ nội bộ", traceId?: string) {
    super(
      ErrorCode.ERR_SERVER,
      message,
      500,
      undefined,
      traceId
    );
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Service Unavailable Error (503 Service Unavailable)
 * Used when dependent services are down
 */
export class ServiceUnavailableError extends ApiError {
  constructor(service: string = "Service", traceId?: string) {
    super(
      ErrorCode.ERR_SERVICE_UNAVAILABLE,
      `${service} tạm thời không khả dụng`,
      503,
      undefined,
      traceId
    );
    this.name = "ServiceUnavailableError";
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Helper: Check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Helper: Get HTTP status code for any error
 */
export function getStatusCode(error: unknown): number {
  if (isApiError(error)) {
    return error.statusCode;
  }
  return 500; // Default to server error
}

/**
 * Helper: Get error code for response
 */
export function getErrorCode(error: unknown): ErrorCode {
  if (isApiError(error)) {
    return error.code;
  }
  return ErrorCode.ERR_SERVER;
}

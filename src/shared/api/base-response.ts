/**
 * Base Response Contracts for API Endpoints
 * Ensures uniform response structure across the entire application
 */

import { ErrorCode } from "./base-errors";

/**
 * Standard success response shape
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  traceId: string;
}

/**
 * Standard error response shape
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  traceId: string;
}

/**
 * Paginated response shape
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  traceId: string;
}

/**
 * Generic API response type
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Factory: Create a success response
 */
export function successResponse<T>(
  data: T,
  traceId: string,
  meta?: Record<string, unknown>
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
    traceId,
  };
}

/**
 * Factory: Create an error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  traceId: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    traceId,
  };
}

/**
 * Factory: Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  traceId: string
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    },
    traceId,
  };
}

/**
 * Helper: Check if response indicates success
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Helper: Check if response indicates error
 */
export function isErrorResponse(response: ApiResponse<unknown>): boolean {
  return response.success === false;
}

/**
 * Helper: Extract data from response safely
 */
export function getResponseData<T>(response: SuccessResponse<T>): T {
  return response.data;
}

/**
 * Helper: Extract error from response safely
 */
export function getResponseError(response: ErrorResponse) {
  return response.error;
}

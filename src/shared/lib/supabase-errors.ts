/**
 * Supabase Error Mapping
 * Maps database errors to domain error types
 */

import {
  ApiError,
  ConflictError,
  NotFoundError,
  InvalidStateError,
  ServerError,
  AuthenticationError,
  ErrorCode,
} from "../api/base-errors";

/**
 * PostgreSQL error codes
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PG_ERROR_CODES = {
  // Integrity constraint violation
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",

  // Undefined
  UNDEFINED_TABLE: "42P01",
  UNDEFINED_COLUMN: "42703",

  // Syntax error
  SYNTAX_ERROR: "42601",

  // Bạn không có quyền truy cập
  INSUFFICIENT_PRIVILEGE: "42501",

  // Auth
  AUTHENTICATION_FAILED: "28P01",
};

/**
 * Supabase-specific error codes
 */
export const SUPABASE_ERROR_CODES = {
  // Auth errors
  INVALID_GRANT: "invalid_grant",
  USER_NOT_FOUND: "user_not_found",
  INVALID_EMAIL: "invalid_email",
  EMAIL_ADDRESS_NOT_CONFIRMED: "email_address_not_confirmed",
  OVER_EMAIL_SEND_RATE_LIMIT: "over_email_send_rate_limit",

  // JWT errors
  INVALID_JWT: "invalid_jwt",
  EXPIRED_JWT: "expired_jwt",

  // Other
  ROW_NOT_FOUND: "PGRST116",
};

/**
 * Map Supabase/PostgreSQL error to domain ApiError
 */
export function mapSupabaseError(error: any): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  // Handle null/undefined
  if (!error) {
      return new ServerError("Đã xảy ra lỗi không xác định");
  }

  // Supabase auth error
  if (error.error_description) {
    const desc = error.error_description.toLowerCase();

    if (desc.includes("invalid_grant") || desc.includes("invalid credentials")) {
      return new AuthenticationError("Thông tin đăng nhập không hợp lệ");
    }

    if (desc.includes("user not found")) {
      return new NotFoundError("người dùng");
    }

    if (desc.includes("invalid email")) {
      return new ApiError(
        ErrorCode.ERR_INVALID_REQUEST,
        "Định dạng email không hợp lệ",
        400
      );
    }
  }

  // Supabase JWT error
  if (error.message) {
    const msg = error.message.toLowerCase();

    if (msg.includes("invalid jwt")) {
      return new AuthenticationError("Token không hợp lệ hoặc đã hết hạn");
    }

    if (msg.includes("expired jwt")) {
      return new AuthenticationError("Token đã hết hạn");
    }
  }

  // PostgreSQL error code
  if (error.code) {
    const code = error.code.toString();

    // Unique constraint violation
    if (
      code === PG_ERROR_CODES.UNIQUE_VIOLATION ||
      code === SUPABASE_ERROR_CODES.ROW_NOT_FOUND
    ) {
      return new ConflictError(
        error.message || "Vi phạm ràng buộc duy nhất"
      );
    }

    // Foreign key constraint violation
    if (code === PG_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
      return new InvalidStateError(
        "Không thể thực hiện thao tác: tồn tại dữ liệu liên quan hoặc thiếu tham chiếu bắt buộc"
      );
    }

    // NOT NULL constraint violation
    if (code === PG_ERROR_CODES.NOT_NULL_VIOLATION) {
      return new ApiError(
        ErrorCode.ERR_INVALID_REQUEST,
        `Thiếu trường bắt buộc: ${error.message}`,
        400
      );
    }

    // Undefined table/column
    if (
      code === PG_ERROR_CODES.UNDEFINED_TABLE ||
      code === PG_ERROR_CODES.UNDEFINED_COLUMN
    ) {
      return new ServerError("Lỗi cấu trúc cơ sở dữ liệu");
    }

    // Insufficient privilege
    if (code === PG_ERROR_CODES.INSUFFICIENT_PRIVILEGE) {
      return new ApiError(
        ErrorCode.ERR_FORBIDDEN,
        "Không đủ quyền để thực hiện thao tác này",
        403
      );
    }

    // Authentication failed
    if (code === PG_ERROR_CODES.AUTHENTICATION_FAILED) {
      return new AuthenticationError("Xác thực cơ sở dữ liệu thất bại");
    }
  }

  // Generic fallback
  const message = error.message || error.toString() || "Lỗi không xác định";
  return new ServerError(message);
}

/**
 * Async wrapper for Supabase queries with error mapping
 *
 * @example
 * const result = await handleSupabaseError(async () => {
 *   return await supabase.from('users').select('*');
 * });
 */
export async function handleSupabaseError<T>(
  operation: () => Promise<{ data?: T; error?: any }>
): Promise<T> {
  try {
    const { data, error } = await operation();

    if (error) {
      throw mapSupabaseError(error);
    }

    if (!data) {
        throw new ServerError("Cơ sở dữ liệu không trả về dữ liệu");
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw mapSupabaseError(error);
  }
}

/**
 * Shared API Layer - Barrel Export
 * 
 * Use this index to import all base API infrastructure.
 * Guarantees no boilerplate duplication across routes.
 * 
 * @example
 * // In src/app/api/users/route.ts
 * import {
 *   createApiHandler,
 *   successResponse,
 *   createUserSchema,
 * } from '@/shared/api';
 * 
 * export const POST = createApiHandler({
 *   requireAuth: true,
 *   requireRole: ['admin'],
 *   validationSchema: createUserSchema,
 *   handler: async (req, context, validatedData) => {
 *     const newUser = await userService.create(validatedData);
 *     return newUser;
 *   }
 * });
 */

// ============================================
// Error Classes & Codes
// ============================================
export {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InvalidStateError,
  ServerError,
  ServiceUnavailableError,
  ErrorCode,
  isApiError,
  getStatusCode,
  getErrorCode,
} from "./base-errors";

// ============================================
// Response Contracts & Factories
// ============================================
export {
  successResponse,
  errorResponse,
  paginatedResponse,
  isSuccessResponse,
  isErrorResponse,
  getResponseData,
  getResponseError,
  type SuccessResponse,
  type ErrorResponse,
  type PaginatedResponse,
  type ApiResponse,
} from "./base-response";

// ============================================
// Type Contracts
// ============================================
export {
  type AuthContext,
  type RequestContext,
  type OptionalAuthContext,
  type ApiHandler,
  type OptionalAuthApiHandler,
  type ApiHandlerOptions,
  type HandlerFactory,
  type ValidationResult,
  type UserRole,
  type RepositoryOptions,
  type QueryFilter,
  type RepositoryResult,
} from "./types";

// ============================================
// Validation Schemas & Helpers
// ============================================
export {
  phoneSchema,
  emailSchema,
  dateSchema,
  amountSchema,
  integerAmountSchema,
  uuidSchema,
  textSchema,
  notesSchema,
  loginSchema,
  createUserSchema,
  createSessionSchema,
  updateSessionSchema,
  attendanceSchema,
  bulkAttendanceSchema,
  createShuttlecockExpenseSchema,
  createMonthSchema,
  validateRequest,
  validateOrThrow,
  createRequestValidator,
  type LoginRequest,
  type CreateUserRequest,
  type CreateSessionRequest,
  type UpdateSessionRequest,
  type AttendanceRequest,
  type BulkAttendanceRequest,
  type CreateShuttlecockExpenseRequest,
  type CreateMonthRequest,
} from "./base-validators";

// ============================================
// Authentication & Middleware
// ============================================
export {
  extractBearerToken,
  decodeJWT,
  extractAuthContext,
  createAnonymousContext,
  requireRole,
  requireAuthentication,
  withAuthGuard,
  withRoleGuard,
  tryExtractAuthContext,
} from "./auth-context";

export {
  generateTraceId,
  withAuthMiddleware,
  withOptionalAuthMiddleware,
  withRoleMiddleware,
  withValidationMiddleware,
  withErrorHandlingMiddleware,
  composeMiddleware,
} from "./middleware";

// ============================================
// Handler Factory (Core)
// ============================================
export {
  createApiHandler,
  createGetHandler,
  createPostHandler,
  createPutHandler,
  createDeleteHandler,
  createPatchHandler,
} from "./base-handler";

/**
 * DOCUMENTATION & QUICK START
 *
 * ============================================
 * 1. Simple Unauthenticated GET Endpoint
 * ============================================
 *
 * // src/app/api/health.ts
 * import { createGetHandler, successResponse } from '@/shared/api';
 *
 * export const GET = createGetHandler({
 *   handler: async (req, context) => {
 *     return {
 *       status: 'ok',
 *       timestamp: context.timestamp.toISOString(),
 *     };
 *   }
 * });
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": { "status": "ok", "timestamp": "2025-04-01T12:34:56Z" },
 *   "traceId": "1234567890-abc123def"
 * }
 *
 * ============================================
 * 2. Authenticated POST Endpoint with Validation
 * ============================================
 *
 * // src/app/api/sessions.ts
 * import {
 *   createPostHandler,
 *   createSessionSchema,
 * } from '@/shared/api';
 *
 * export const POST = createPostHandler({
 *   requireAuth: true,
 *   requireRole: ['admin'],
 *   validationSchema: createSessionSchema,
 *   handler: async (req, context, validatedData) => {
 *     // validatedData is typed as CreateSessionRequest
 *     const session = await sessionService.create(validatedData);
 *     return session;
 *   }
 * });
 *
 * Request (POST):
 * {
 *   "session_date": "2025-04-01",
 *   "court_expense_amount": 100000,
 *   "payer_user_id": "uuid-here"
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": { "id": 1, "session_date": "2025-04-01", ... },
 *   "traceId": "..."
 * }
 *
 * Error Response (400):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERR_VALIDATION",
 *     "message": "Request validation failed",
 *     "details": {
 *       "court_expense_amount": ["Amount must be greater than 0"]
 *     }
 *   },
 *   "traceId": "..."
 * }
 *
 * ============================================
 * 3. Error Handling
 * ============================================
 *
 * All ApiError subclasses are caught automatically:
 * - ValidationError (400)
 * - AuthenticationError (401)
 * - AuthorizationError (403)
 * - NotFoundError (404)
 * - ConflictError (409)
 * - InvalidStateError (422)
 * - ServerError (500)
 *
 * Example in handler:
 * handler: async (req, context, validatedData) => {
 *   const user = await userRepository.findById(validatedData.userId);
 *   if (!user) {
 *     throw new NotFoundError('User', context.traceId);
 *   }
 *   return user;
 * }
 *
 * Response (404):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERR_NOT_FOUND",
 *     "message": "User not found"
 *   },
 *   "traceId": "..."
 * }
 *
 * ============================================
 * KEY PRINCIPLES
 * ============================================
 *
 * 1. All handlers use createApiHandler (or helpers)
 *    → Prevents boilerplate, ensures consistency
 *
 * 2. All responses include traceId
 *    → Enables debugging and audit trail
 *
 * 3. All validation uses base-validators
 *    → Reusable schemas, consistent error format
 *
 * 4. All errors throw ApiError subclasses
 *    → Auto-formatted with correct HTTP status
 *
 * 5. All auth uses auth-context guards
 *    → Centralized, testable, flexible
 *
 * NEVER:
 * - Manually create Response objects
 * - Write try/catch in handlers (built-in)
 * - Validate inline (use createRequestValidator)
 * - Return ad-hoc error shapes
 * - Extract auth manually in handlers
 */

/**
 * Base API Handler Factory
 * Core infrastructure for creating type-safe, error-handled API routes
 * 
 * Usage:
 * ```
 * import { createApiHandler, successResponse } from '@/shared/api';
 * 
 * export const POST = createApiHandler({
 *   requireAuth: true,
 *   validationSchema: createUserSchema,
 *   handler: async (req, context, validatedData) => {
 *     // validatedData is typed as CreateUserRequest
 *     const newUser = await userService.create(validatedData);
 *     return successResponse(newUser, context.traceId);
 *   }
 * });
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  ErrorCode,
} from "./base-errors";
import { errorResponse, successResponse } from "./base-response";
import { validateRequest } from "./base-validators";
import {
  extractAuthContext,
  tryExtractAuthContext,
  requireAuthentication,
  requireRole,
} from "./auth-context";
import {
  RequestContext,
  OptionalAuthContext,
  ApiHandlerOptions,
  AuthContext,
  UserRole,
} from "./types";

/**
 * Generate trace ID for request tracking
 */
function generateTraceId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${random}`;
}

/**
 * Main API Handler Factory
 *
 * Applies middleware stack based on configuration:
 * 1. Generates trace ID
 * 2. Extracts authentication (if required)
 * 3. Validates request body (if schema provided)
 * 4. Executes handler logic
 * 5. Catches and formats errors with trace ID
 *
 * @param options Configuration for the handler
 * @returns Next.js API route handler function
 */
export function createApiHandler<TReq = unknown, TRes = unknown>(
  options: ApiHandlerOptions<TReq>
) {
  return async (req: NextRequest): Promise<NextResponse<any>> => {
    const traceId = generateTraceId();
    const path = req.nextUrl.pathname;

    try {
      // Log request for debugging
      console.log(
        `[${traceId}] ${req.method} ${path} - Auth required: ${options.requireAuth || false}`
      );

      // ========================================
      // Step 1: Handle Authentication
      // ========================================
      let auth: AuthContext;

      if (options.requireAuth) {
        auth = await extractAuthContext(req, traceId);
        requireAuthentication(auth, traceId);

        // Check role if specified
        if (options.requireRole && options.requireRole.length > 0) {
          requireRole(auth, options.requireRole, traceId);
        }
      } else {
        // Optional auth: try to extract, but don't fail
        auth = await tryExtractAuthContext(req, traceId);
      }

      const context: RequestContext | OptionalAuthContext = {
        auth,
        traceId,
        timestamp: new Date(),
        path,
      };

      // ========================================
      // Step 2: Handle Request Body Validation
      // ========================================
      let validatedData: TReq | undefined;

      if (options.validationSchema) {
        // Read body only if validation schema exists
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          body = {};
        }

        const validation = validateRequest(body, options.validationSchema);
        if (!validation.isValid) {
          return NextResponse.json(
            errorResponse(
              ErrorCode.ERR_VALIDATION,
              "Request validation failed",
              traceId,
              validation.errors
            ),
            { status: 400 }
          );
        }
        validatedData = validation.data;
      }

      // ========================================
      // Step 3: Execute Handler Logic
      // ========================================
      const result = await options.handler(req, context, validatedData);

      // If handler returns NextResponse directly, return it
      if (result instanceof NextResponse) {
        return result;
      }

      // Otherwise, wrap result in success response
      return NextResponse.json(
        successResponse(result, traceId),
        { status: 200 }
      );
    } catch (error) {
      // ========================================
      // Step 4: Error Handling
      // ========================================

      if (error instanceof ApiError) {
        console.warn(`[${traceId}] API Error: ${error.code} - ${error.message}`);
        return NextResponse.json(
          errorResponse(error.code, error.message, traceId, error.details),
          { status: error.statusCode }
        );
      }

      // Unknown error - log and return 500
      console.error(`[${traceId}] Unexpected error:`, error);
      const serverError = new ServerError("Internal server error", traceId);
      return NextResponse.json(
        errorResponse(serverError.code, serverError.message, traceId),
        { status: 500 }
      );
    }
  };
}

/**
 * Helper: Create a GET handler
 *
 * @example
 * export const GET = createGetHandler({
 *   handler: async (req, context) => {
 *     return { items: [...] };
 *   }
 * });
 */
export function createGetHandler<TRes = unknown>(
  options: Omit<ApiHandlerOptions<unknown>, "method">
) {
  return createApiHandler<unknown, TRes>({
    ...options,
    method: "GET",
  });
}

/**
 * Helper: Create a POST handler
 */
export function createPostHandler<TReq, TRes = unknown>(
  options: Omit<ApiHandlerOptions<TReq>, "method">
) {
  return createApiHandler<TReq, TRes>({
    ...options,
    method: "POST",
  });
}

/**
 * Helper: Create a PUT handler
 */
export function createPutHandler<TReq, TRes = unknown>(
  options: Omit<ApiHandlerOptions<TReq>, "method">
) {
  return createApiHandler<TReq, TRes>({
    ...options,
    method: "PUT",
  });
}

/**
 * Helper: Create a DELETE handler
 */
export function createDeleteHandler<TReq = unknown, TRes = unknown>(
  options: Omit<ApiHandlerOptions<TReq>, "method">
) {
  return createApiHandler<TReq, TRes>({
    ...options,
    method: "DELETE",
  });
}

/**
 * Helper: Create a PATCH handler
 */
export function createPatchHandler<TReq, TRes = unknown>(
  options: Omit<ApiHandlerOptions<TReq>, "method">
) {
  return createApiHandler<TReq, TRes>({
    ...options,
    method: "PATCH",
  });
}

/**
 * Composable Middleware Layer
 * Provides reusable middleware for auth, validation, and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, ServerError, ErrorCode } from "./base-errors";
import {
  extractAuthContext,
  tryExtractAuthContext,
  requireAuthentication,
  requireRole,
} from "./auth-context";
import { errorResponse, successResponse } from "./base-response";
import { validateRequest } from "./base-validators";
import { AuthContext, ApiHandler, RequestContext, UserRole } from "./types";

// ============================================
// Middleware Utilities
// ============================================

/**
 * Generate a unique trace ID for request tracking
 */
export function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware: Extract authentication context
 */
export async function withAuthMiddleware(
  req: NextRequest,
  handler: (
    req: NextRequest,
    auth: AuthContext
  ) => Promise<NextResponse>,
  traceId: string
): Promise<NextResponse> {
  try {
    const auth = await extractAuthContext(req, traceId);
    requireAuthentication(auth, traceId);
    return await handler(req, auth);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        errorResponse(error.code, error.message, traceId, error.details),
        { status: error.statusCode }
      );
    }
    const serverError = new ServerError("Authentication failed", traceId);
    return NextResponse.json(
      errorResponse(serverError.code, serverError.message, traceId),
      { status: 500 }
    );
  }
}

/**
 * Middleware: Optional authentication (fail gracefully)
 */
export async function withOptionalAuthMiddleware(
  req: NextRequest,
  handler: (
    req: NextRequest,
    auth: AuthContext
  ) => Promise<NextResponse>,
  traceId: string
): Promise<NextResponse> {
  try {
    const auth = await tryExtractAuthContext(req, traceId);
    return await handler(req, auth);
  } catch (error) {
    const serverError = new ServerError("Request processing failed", traceId);
    return NextResponse.json(
      errorResponse(serverError.code, serverError.message, traceId),
      { status: 500 }
    );
  }
}

/**
 * Middleware: Role-based access control
 */
export async function withRoleMiddleware(
  req: NextRequest,
  requiredRoles: UserRole[],
  handler: (
    req: NextRequest,
    auth: AuthContext
  ) => Promise<NextResponse>,
  traceId: string
): Promise<NextResponse> {
  try {
    const auth = await extractAuthContext(req, traceId);
    requireAuthentication(auth, traceId);
    requireRole(auth, requiredRoles, traceId);
    return await handler(req, auth);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        errorResponse(error.code, error.message, traceId, error.details),
        { status: error.statusCode }
      );
    }
    const serverError = new ServerError("Authorization failed", traceId);
    return NextResponse.json(
      errorResponse(serverError.code, serverError.message, traceId),
      { status: 500 }
    );
  }
}

/**
 * Middleware: Request body validation
 */
export async function withValidationMiddleware<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>,
  handler: (
    req: NextRequest,
    validatedData: T
  ) => Promise<NextResponse>,
  traceId: string
): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const validation = validateRequest(body, schema);

    if (!validation.isValid) {
      const error = new ApiError(
        ErrorCode.ERR_VALIDATION,
        "Request validation failed",
        400,
        validation.errors,
        traceId
      );
      return NextResponse.json(
        errorResponse(error.code, error.message, traceId, error.details),
        { status: 400 }
      );
    }

    return await handler(req, validation.data!);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        errorResponse(error.code, error.message, traceId, error.details),
        { status: error.statusCode }
      );
    }
    const serverError = new ServerError("Request processing failed", traceId);
    return NextResponse.json(
      errorResponse(serverError.code, serverError.message, traceId),
      { status: 500 }
    );
  }
}

/**
 * Middleware: Global error handling wrapper
 */
export async function withErrorHandlingMiddleware(
  handler: () => Promise<NextResponse>,
  traceId: string
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        errorResponse(error.code, error.message, traceId, error.details),
        { status: error.statusCode }
      );
    }

    console.error(`[${traceId}] Unexpected error:`, error);
    const serverError = new ServerError("Internal server error", traceId);
    return NextResponse.json(
      errorResponse(serverError.code, serverError.message, traceId),
      { status: 500 }
    );
  }
}

// ============================================
// Middleware Composition Helpers
// ============================================

/**
 * Compose multiple middleware functions
 * Executes left to right: auth → validation → handler
 */
export function composeMiddleware<T>(
  middlewareFunctions: Array<(next: () => Promise<NextResponse>) => Promise<NextResponse>>
): () => Promise<NextResponse> {
  return async () => {
    let index = 0;

    const next = async (): Promise<NextResponse> => {
      if (index >= middlewareFunctions.length) {
        return NextResponse.json({ error: "No handler" }, { status: 500 });
      }
      return middlewareFunctions[index++](next);
    };

    return next();
  };
}

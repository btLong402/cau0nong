/**
 * Core Type Contracts for API Infrastructure
 * Defines auth context, request context, and handler signatures
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * User Role enum
 */
export type UserRole = "admin" | "member";

/**
 * Authentication Context
 * Attached to every request through middleware
 */
export interface AuthContext {
  userId: string;
  userRole: UserRole;
  isAuthenticated: boolean;
  email?: string;
}

/**
 * Request Context
 * Contains auth, trace ID, and metadata for every API request
 */
export interface RequestContext {
  auth: AuthContext;
  traceId: string;
  timestamp: Date;
  path?: string;
  params: Promise<any>;
}

/**
 * Optional auth context when auth is not required
 */
export interface OptionalAuthContext {
  auth?: AuthContext;
  traceId: string;
  timestamp: Date;
  path?: string;
  params: Promise<any>;
}

/**
 * API Handler signature for authenticated endpoints
 */
export type ApiHandler<TReq = unknown, TRes = unknown> = (
  req: NextRequest,
  context: RequestContext
) => Promise<NextResponse<TRes>>;

/**
 * API Handler signature for optional auth endpoints
 */
export type OptionalAuthApiHandler<TReq = unknown, TRes = unknown> = (
  req: NextRequest,
  context: OptionalAuthContext
) => Promise<NextResponse<TRes>>;

/**
 * Handler options for createApiHandler factory
 */
export interface ApiHandlerOptions<TReq> {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  requireAuth?: boolean;
  requireRole?: UserRole[];
  validationSchema?: z.ZodSchema<TReq>;
  handler: (
    req: NextRequest,
    context: RequestContext | OptionalAuthContext,
    validatedData?: TReq
  ) => Promise<unknown>;
}

/**
 * Handler factory return type
 */
export type HandlerFactory = (
  req: NextRequest,
  context: { params: Promise<any> }
) => Promise<NextResponse>;

/**
 * Validation Result type
 */
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Repository options
 */
export interface RepositoryOptions {
  tableName: string;
  primaryKey?: string;
}

/**
 * Query filter type
 */
export type QueryFilter = Record<string, unknown>;

/**
 * Generic repository result
 */
export interface RepositoryResult<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  count?: number;
}

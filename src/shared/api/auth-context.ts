/**
 * Authentication Context Extraction & Verification
 * Handles JWT token extraction from headers and verification
 */

import { NextRequest } from "next/server";
import { AuthenticationError, AuthorizationError } from "./base-errors";
import { AuthContext, UserRole } from "./types";

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Extract auth token from header first, then fallback to auth cookie.
 */
export function extractAuthToken(req: NextRequest): string | null {
  const bearerToken = extractBearerToken(req);
  if (bearerToken) {
    return bearerToken;
  }

  return req.cookies.get("auth_token")?.value || null;
}

/**
 * Decode JWT token (basic parsing, no verification)
 * WARNING: This is for development/testing. Production should verify signature.
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (second part)
    const decoded = Buffer.from(parts[1], "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Extract authentication context from request
 * Returns AuthContext with user info, or throws AuthenticationError
 */
export async function extractAuthContext(
  req: NextRequest,
  traceId: string
): Promise<AuthContext> {
  const token = extractAuthToken(req);

  if (!token) {
    throw new AuthenticationError(
      "Missing authentication token",
      traceId
    );
  }

  // For Phase 0: Use JWT decode as stub
  // Phase 1 will integrate with Supabase Auth for signature verification
  const payload = decodeJWT(token);

  if (!payload) {
      throw new AuthenticationError("Định dạng token không hợp lệ", traceId);
  }

  // Extract expected fields from JWT payload
  const userId = payload.sub || payload.user_id || payload.id;
  
  // Supabase stores roles in app_metadata or user_metadata
  const appMetadata = (payload.app_metadata as Record<string, unknown>) || {};
  const userMetadata = (payload.user_metadata as Record<string, unknown>) || {};
  
  const userRole = (
    appMetadata.role || 
    userMetadata.role || 
    payload.role || 
    "member"
  ) as UserRole;
  
  const email = payload.email as string | undefined;

  if (!userId) {
     throw new AuthenticationError("Token thiếu ID người dùng", traceId);
  }

  return {
    userId: String(userId),
    userRole,
    isAuthenticated: true,
    email,
  };
}

/**
 * Create anonymous (unauthenticated) context
 * Used when auth is optional
 */
export function createAnonymousContext(): AuthContext {
  return {
    userId: "",
    userRole: "member",
    isAuthenticated: false,
  };
}

/**
 * Verify user has required role
 * Throws AuthorizationError if role not included
 */
export function requireRole(
  context: AuthContext,
  requiredRoles: UserRole[],
  traceId: string
): void {
  if (!requiredRoles.includes(context.userRole)) {
    throw new AuthorizationError(
      `This action requires one of roles: ${requiredRoles.join(", ")}`,
      traceId
    );
  }
}

/**
 * Verify user is authenticated
 * Throws AuthenticationError if not authenticated
 */
export function requireAuthentication(
  context: AuthContext,
  traceId: string
): void {
  if (!context.isAuthenticated) {
    throw new AuthenticationError("Yêu cầu đăng nhập", traceId);
  }
}

/**
 * Guard middleware: Ensure authentication
 * Returns auth context if valid, throws otherwise
 */
export async function withAuthGuard(
  req: NextRequest,
  traceId: string
): Promise<AuthContext> {
  const auth = await extractAuthContext(req, traceId);
  requireAuthentication(auth, traceId);
  return auth;
}

/**
 * Guard middleware: Ensure authentication + specific role
 * Returns auth context if valid, throws otherwise
 */
export async function withRoleGuard(
  req: NextRequest,
  requiredRoles: UserRole[],
  traceId: string
): Promise<AuthContext> {
  const auth = await extractAuthContext(req, traceId);
  requireAuthentication(auth, traceId);
  requireRole(auth, requiredRoles, traceId);
  return auth;
}

/**
 * Optional auth: Try to extract context, return anonymous if fails
 */
export async function tryExtractAuthContext(
  req: NextRequest,
  _traceId: string
): Promise<AuthContext> {
  try {
    const token = extractAuthToken(req);
    if (!token) {
      return createAnonymousContext();
    }

    const payload = decodeJWT(token);
    if (!payload) {
      return createAnonymousContext();
    }

    const userId = payload.sub || payload.user_id || payload.id;
    if (!userId) {
      return createAnonymousContext();
    }

    const appMetadata = (payload.app_metadata as Record<string, unknown>) || {};
    const userMetadata = (payload.user_metadata as Record<string, unknown>) || {};
    
    const userRole = (
      appMetadata.role || 
      userMetadata.role || 
      payload.role || 
      "member"
    ) as UserRole;

    return {
      userId: String(userId),
      userRole,
      isAuthenticated: true,
      email: payload.email as string | undefined,
    };
  } catch {
    return createAnonymousContext();
  }
}

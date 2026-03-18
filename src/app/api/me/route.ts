/**
 * Current User Info Endpoint
 * 
 * GET endpoint that requires authentication.
 * Returns information about the currently authenticated user.
 * Demonstrates auth context extraction and type safety.
 * 
 * GET /api/me
 * Headers: Authorization: Bearer <token>
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "user-uuid-123",
 *     "role": "admin",
 *     "email": "user@example.com",
 *     "isAuthenticated": true
 *   },
 *   "traceId": "..."
 * }
 * 
 * Error (401 - Missing auth):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERR_UNAUTHENTICATED",
 *     "message": "Authentication required"
 *   },
 *   "traceId": "..."
 * }
 */

import { createGetHandler, type RequestContext } from "@/shared/api";

export const GET = createGetHandler({
  requireAuth: true,
  handler: async (req, context) => {
    // Cast context to RequestContext since requireAuth: true ensures auth exists
    const authContext = context as RequestContext;
    return {
      userId: authContext.auth.userId,
      role: authContext.auth.userRole,
      email: authContext.auth.email || "not-provided",
      isAuthenticated: authContext.auth.isAuthenticated,
    };
  },
});

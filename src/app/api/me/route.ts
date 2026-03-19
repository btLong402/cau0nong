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

import {
  createGetHandler,
  createPutHandler,
  phoneSchema,
  type RequestContext,
} from "@/shared/api";
import { createUsersService } from "@/modules/users/users.service";
import { z } from "zod";

const updateMyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  phone: phoneSchema.optional(),
  avatar_url: z
    .union([
      z.string().trim().url("Invalid avatar URL format"),
      z.literal(""),
      z.null(),
    ])
    .optional(),
}).refine(
  (data) =>
    data.name !== undefined ||
    data.phone !== undefined ||
    data.avatar_url !== undefined,
  {
    message: "At least one profile field must be provided",
  }
);

type UpdateMyProfileRequest = z.infer<typeof updateMyProfileSchema>;

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

export const PUT = createPutHandler<UpdateMyProfileRequest>({
  requireAuth: true,
  validationSchema: updateMyProfileSchema,
  handler: async (req, context, validatedData) => {
    const authContext = context as RequestContext;
    const usersService = await createUsersService();
    const avatarUrl =
      validatedData?.avatar_url === "" ? null : validatedData?.avatar_url;

    const user = await usersService.updateMember(authContext.auth.userId, {
      name: validatedData?.name,
      phone: validatedData?.phone,
      avatar_url: avatarUrl,
    });

    return { user };
  },
});

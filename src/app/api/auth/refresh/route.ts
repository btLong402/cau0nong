import { createPostHandler } from '@/shared/api';
import { createAuthService } from '@/modules/auth/auth.service';
import { successResponse } from '@/shared/api/base-response';
import { NextResponse } from 'next/server';

export const POST = createPostHandler({
  requireAuth: true,
  handler: async (_req, context) => {
    const authService = await createAuthService();
    const session = await authService.refreshSession();
    const user = await authService.getCurrentUser();

    const response = NextResponse.json(
      successResponse(
        {
          user,
          token: session.access_token,
        },
        context.traceId,
      ),
      { status: 200 },
    );

    response.cookies.set('auth_token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  },
});

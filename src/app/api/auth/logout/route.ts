import { createPostHandler } from '@/shared/api';
import { createAuthService } from '@/modules/auth/auth.service';
import { successResponse } from '@/shared/api/base-response';
import { NextResponse } from 'next/server';

export const POST = createPostHandler({
  handler: async (req, context) => {
    const authService = await createAuthService();
    await authService.signOut();

    const response = NextResponse.json(
      successResponse({ message: 'Đăng xuất thành công' }, context.traceId),
      { status: 200 },
    );

    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  },
});

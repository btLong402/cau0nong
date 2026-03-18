import { createPostHandler } from '@/shared/api';
import { emailSchema } from '@/shared/api/base-validators';
import { createAuthService } from '@/modules/auth/auth.service';
import { ValidationError } from '@/shared/api/base-errors';
import { successResponse } from '@/shared/api/base-response';
import { NextResponse } from 'next/server';

export const POST = createPostHandler({
  handler: async (req, context) => {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      throw new ValidationError('Missing required fields: email, password');
    }

    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      throw new ValidationError(`Invalid email: ${emailValidation.error.message}`);
    }

    const authService = await createAuthService();
    const result = await authService.signIn({ email, password });

    const response = NextResponse.json(
      successResponse(
        {
          user: result.user,
          token: result.token,
        },
        context.traceId,
      ),
      { status: 200 },
    );

    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  },
});

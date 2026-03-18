import { createPostHandler } from '@/shared/api';
import { createAuthService } from '@/modules/auth/auth.service';
import { ValidationError } from '@/shared/api/base-errors';
import { successResponse } from '@/shared/api/base-response';
import { NextResponse } from 'next/server';

/**
 * Detect if input is a phone number (starts with 0, +84, etc.)
 */
function isPhoneNumber(input: string): boolean {
  const trimmed = input.trim();
  return /^(\+?\d{9,15}|0\d{8,11})$/.test(trimmed);
}

export const POST = createPostHandler({
  handler: async (req, context) => {
    const { email, phone, password, identifier } = await req.json();

    if (!password) {
      throw new ValidationError('Missing required field: password');
    }

    const authService = await createAuthService();
    let result;

    // Support 3 modes:
    // 1. { email, password } — classic email login
    // 2. { phone, password } — explicit phone login
    // 3. { identifier, password } — auto-detect email vs phone
    if (phone) {
      result = await authService.signInWithPhone(phone, password);
    } else if (identifier && isPhoneNumber(identifier)) {
      result = await authService.signInWithPhone(identifier, password);
    } else {
      const emailValue = email || identifier;
      if (!emailValue) {
        throw new ValidationError('Missing required field: email, phone, or identifier');
      }
      result = await authService.signIn({ email: emailValue, password });
    }

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


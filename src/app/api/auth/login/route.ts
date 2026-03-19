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
    const { username, email, phone, password, identifier } = await req.json();

    if (!password) {
      throw new ValidationError('Missing required field: password');
    }

    const authService = await createAuthService();
    let result;

    // Support multiple modes for backward compatibility:
    // 1. { username, password }
    // 2. { identifier, password } (username/email/phone)
    // 3. { email, password }
    // 4. { phone, password }
    if (username) {
      result = await authService.signInWithUsername(username, password);
    } else if (phone) {
      result = await authService.signInWithPhone(phone, password);
    } else if (identifier && isPhoneNumber(identifier)) {
      result = await authService.signInWithPhone(identifier, password);
    } else {
      const loginIdentifier = identifier || email;
      if (!loginIdentifier) {
        throw new ValidationError('Missing required field: username, identifier, email, or phone');
      }
      result = await authService.signIn({ identifier: loginIdentifier, password });
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


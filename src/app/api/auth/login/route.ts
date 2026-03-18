import { createPostHandler } from '@/shared/api';
import { createAuthValidator } from '@/shared/api/base-validators';
import { createAuthService } from '@/modules/auth/auth.service';
import { ValidationError } from '@/shared/api/base-errors';

export const POST = createPostHandler({
  handler: async (req) => {
    const { email, password } = await req.json();

    const validator = createAuthValidator();
    
    if (!email || !password) {
      throw new ValidationError('Missing required fields: email, password');
    }

    const emailValidation = validator.emailSchema.safeParse(email);
    if (!emailValidation.success) {
      throw new ValidationError(`Invalid email: ${emailValidation.error.message}`);
    }

    const authService = await createAuthService();
    const result = await authService.signIn(email, password);

    return { 
      user: result.user,
      token: result.token,
    };
  },
});

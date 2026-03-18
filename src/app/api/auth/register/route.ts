import { createPostHandler } from '@/shared/api';
import { createAuthValidator } from '@/shared/api/base-validators';
import { createAuthService } from '@/modules/auth/auth.service';
import { ValidationError } from '@/shared/api/base-errors';

export const POST = createPostHandler({
  handler: async (req, context) => {
    const { email, password, name, phone } = await req.json();

    const validator = createAuthValidator();
    
    if (!email || !password || !name || !phone) {
      throw new ValidationError('Missing required fields: email, password, name, phone');
    }

    const emailValidation = validator.emailSchema.safeParse(email);
    if (!emailValidation.success) {
      throw new ValidationError(`Invalid email: ${emailValidation.error.message}`);
    }

    const phoneValidation = validator.phoneSchema.safeParse(phone);
    if (!phoneValidation.success) {
      throw new ValidationError(`Invalid phone: ${phoneValidation.error.message}`);
    }

    const authService = await createAuthService();
    
    const user = await authService.signUp({
      email,
      password,
      name,
      phone,
    });

    return { user };
  },
});

import { createPostHandler } from '@/shared/api';
import { emailSchema, phoneSchema } from '@/shared/api/base-validators';
import { createAuthService } from '@/modules/auth/auth.service';
import { ValidationError } from '@/shared/api/base-errors';

export const POST = createPostHandler({
  handler: async (req) => {
    const { username, email, password, name, phone } = await req.json();
    
    if (!username || !email || !password || !name || !phone) {
      throw new ValidationError('Missing required fields: username, email, password, name, phone');
    }

    if (!/^[a-zA-Z0-9_]{4,30}$/.test(username)) {
      throw new ValidationError('Username must be 4-30 characters and only include letters, numbers, underscore');
    }

    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      throw new ValidationError(`Invalid email: ${emailValidation.error.message}`);
    }

    const phoneValidation = phoneSchema.safeParse(phone);
    if (!phoneValidation.success) {
      throw new ValidationError(`Invalid phone: ${phoneValidation.error.message}`);
    }

    const authService = await createAuthService();
    
    const user = await authService.signUp({
      username: username.toLowerCase(),
      email,
      password,
      name,
      phone,
    });

    return { user };
  },
});

import { createPostHandler } from '@/shared/api';
import { createAuthService } from '@/modules/auth/auth.service';

export const POST = createPostHandler({
  handler: async (req) => {
    const authService = await createAuthService();
    const result = await authService.refreshSession();

    if (!result) {
      throw new Error('Failed to refresh session');
    }

    return { 
      user: result.user,
      token: result.token,
    };
  },
});

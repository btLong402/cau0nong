import { createGetHandler } from '@/shared/api';
import { createAuthService } from '@/modules/auth/auth.service';

export const GET = createGetHandler({
  requireAuth: true,
  handler: async () => {
    const authService = await createAuthService();
    const user = await authService.getCurrentUser();

    return { user };
  },
});

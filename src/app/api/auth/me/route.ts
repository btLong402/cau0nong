import { createGetHandler } from '@/shared/api';
import { createAuthService } from '@/modules/auth/auth.service';

export const GET = createGetHandler({
  handler: async (req, context) => {
    const authService = await createAuthService();
    const user = await authService.getSession();

    return { user };
  },
});

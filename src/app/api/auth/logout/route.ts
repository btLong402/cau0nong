import { createPostHandler } from '@/shared/api';
import { createAuthService } from '@/modules/auth/auth.service';

export const POST = createPostHandler({
  handler: async (req, context) => {
    const authService = await createAuthService();
    await authService.signOut();
    
    return { success: true, message: 'Logged out successfully' };
  },
});

import { createGetHandler } from '@/shared/api';
import { decodeJWT } from '@/shared/api/auth-context';
import { createAdminClient } from '@/lib/supabase';
import { AuthenticationError } from '@/shared/api';

export const GET = createGetHandler({
  requireAuth: true,
  handler: async (_, context) => {
    // Extract user ID from auth context (already decoded from token)
    const userId = context.auth?.userId;
    
    if (!userId) {
      throw new AuthenticationError('No user ID in token');
    }

    // Fetch user profile from database
    const adminClient = createAdminClient();
    const { data: profile, error } = await adminClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AuthenticationError('User profile not found');
    }

    return {
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
        balance: profile.balance || 0,
      },
    };
  },
});

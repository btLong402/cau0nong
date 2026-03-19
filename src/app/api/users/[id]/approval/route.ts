import { createPatchHandler } from '@/shared/api';
import { ValidationError } from '@/shared/api/base-errors';
import { createUsersService } from '@/modules/users/users.service';

function parseUserId(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const approvalIndex = segments.lastIndexOf('approval');
  const userId = approvalIndex > 0 ? segments[approvalIndex - 1] : '';

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  return userId;
}

export const PATCH = createPatchHandler({
  requireAuth: true,
  requireRole: ['admin'],
  handler: async (req) => {
    const userId = parseUserId(req.url);
    const { action } = await req.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      throw new ValidationError("Action must be either 'approve' or 'reject'");
    }

    const usersService = await createUsersService();
    const user =
      action === 'approve'
        ? await usersService.approveMember(userId)
        : await usersService.rejectMember(userId);

    return { user };
  },
});

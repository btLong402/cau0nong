import { createGetHandler, createPutHandler } from '@/shared/api';
import { createUsersService } from '@/modules/users/users.service';
import { ValidationError } from '@/shared/api/base-errors';

export const GET = createGetHandler({
  requireAuth: true,
  requireRole: ['admin'],
  handler: async (req, context) => {
    const { id: userId } = await context.params;
    if (!userId) throw new ValidationError('User ID is required');

    const usersService = await createUsersService();
    const user = await usersService.getMember(userId);

    return { user };
  },
});

export const PUT = createPutHandler({
  requireAuth: true,
  requireRole: ['admin'],
  handler: async (req, context) => {
    const { id: userId } = await context.params;
    if (!userId) throw new ValidationError('User ID is required');

    const data = await req.json();
    const usersService = await createUsersService();
    const user = await usersService.updateMember(userId, data);

    return { user };
  },
});

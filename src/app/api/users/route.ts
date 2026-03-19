import { createGetHandler, createPostHandler } from '@/shared/api';
import { createUsersService } from '@/modules/users/users.service';
import { ValidationError } from '@/shared/api/base-errors';

export const GET = createGetHandler({
  requireAuth: true,
  requireRole: ['admin'],
  handler: async (req) => {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (page < 1 || limit < 1) {
      throw new ValidationError('Invalid pagination parameters');
    }

    const usersService = await createUsersService();
    const result = await usersService.listMembers(page, limit);

    return result;
  },
});

export const POST = createPostHandler({
  requireAuth: true,
  requireRole: ['admin'],
  handler: async (req) => {
    const { username, email, phone, name, password, role } = await req.json();

    if (!email || !phone || !name || !username) {
      throw new ValidationError('Missing required fields: username, email, phone, name');
    }

    if (!/^[a-zA-Z0-9_]{4,30}$/.test(username)) {
      throw new ValidationError('Username must be 4-30 characters and only include letters, numbers, underscore');
    }

    const usersService = await createUsersService();
    const user = await usersService.createMember({
      username: username.toLowerCase(),
      email,
      phone,
      name,
      password,
      role: role || 'member'
    });

    return { user };
  },
});

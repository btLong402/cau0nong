import { createGetHandler, createPostHandler } from '@/shared/api';
import { createUsersService } from '@/modules/users/users.service';
import { ValidationError } from '@/shared/api/base-errors';

export const GET = createGetHandler({
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
  handler: async (req) => {
    const { email, phone, name } = await req.json();

    if (!email || !phone || !name) {
      throw new ValidationError('Missing required fields: email, phone, name');
    }

    const usersService = await createUsersService();
    const user = await usersService.getMember(email);

    return { user };
  },
});

import { createGetHandler, createPutHandler } from '@/shared/api';
import { createUsersService } from '@/modules/users/users.service';
import { ValidationError } from '@/shared/api/base-errors';

function parseUserId(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const userId = segments[segments.length - 1];

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  return userId;
}

export const GET = createGetHandler({
  handler: async (req) => {
    const userId = parseUserId(req.url);
    const usersService = await createUsersService();
    const user = await usersService.getMember(userId);

    return { user };
  },
});

export const PUT = createPutHandler({
  handler: async (req) => {
    const userId = parseUserId(req.url);
    const data = await req.json();

    const usersService = await createUsersService();
    const user = await usersService.updateMember(userId, data);

    return { user };
  },
});

import { createPutHandler } from '@/shared/api';
import { createUsersService } from '@/modules/users/users.service';
import { ValidationError } from '@/shared/api/base-errors';

function parseUserId(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const userId = segments[segments.length - 2];

  if (!userId) {
    throw new ValidationError('Thiếu ID người dùng');
  }

  return userId;
}

export const PUT = createPutHandler({
  handler: async (req) => {
    const userId = parseUserId(req.url);
    const { amount } = await req.json();

    if (amount === undefined || typeof amount !== 'number') {
      throw new ValidationError('Amount là bắt buộc và phải là số');
    }

    const usersService = await createUsersService();
    const user = await usersService.updateBalance(userId, amount);

    return { user };
  },
});

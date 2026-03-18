import { createPutHandler } from '@/shared/api';
import { createUsersService } from '@/modules/users/users.service';
import { NotFoundError, ValidationError } from '@/shared/api/base-errors';

interface Params {
  id: string;
}

export const PUT = createPutHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { id } = params;
    const { amount } = await req.json();

    if (!id) {
      throw new ValidationError('User ID is required');
    }

    if (amount === undefined || typeof amount !== 'number') {
      throw new ValidationError('Amount is required and must be a number');
    }

    const usersService = await createUsersService();
    const user = await usersService.updateBalance(id, amount);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { user };
  },
});

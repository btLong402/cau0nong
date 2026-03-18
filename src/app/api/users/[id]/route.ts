import { createGetHandler, createPutHandler } from '@/shared/api';
import { createUsersService } from '@/modules/users/users.service';
import { NotFoundError, ValidationError } from '@/shared/api/base-errors';

interface Params {
  id: string;
}

export const GET = createGetHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { id } = params;

    if (!id) {
      throw new ValidationError('User ID is required');
    }

    const usersService = await createUsersService();
    const user = await usersService.getMember(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { user };
  },
});

export const PUT = createPutHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { id } = params;
    const data = await req.json();

    if (!id) {
      throw new ValidationError('User ID is required');
    }

    const usersService = await createUsersService();
    const user = await usersService.updateMember(id, data);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { user };
  },
});

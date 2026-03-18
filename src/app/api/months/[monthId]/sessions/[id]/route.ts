import { createGetHandler, createPutHandler, createDeleteHandler } from '@/shared/api';
import { createSessionsService } from '@/modules/sessions/sessions.service';
import { NotFoundError, ValidationError } from '@/shared/api/base-errors';

interface Params {
  monthId: string;
  id: string;
}

export const GET = createGetHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { id } = params;

    if (!id) {
      throw new ValidationError('Session ID is required');
    }

    const sessionsService = await createSessionsService();
    const session = await sessionsService.getSession(parseInt(id));

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    return { session };
  },
});

export const PUT = createPutHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { id } = params;
    const data = await req.json();

    if (!id) {
      throw new ValidationError('Session ID is required');
    }

    const sessionsService = await createSessionsService();
    const session = await sessionsService.updateSession(parseInt(id), data);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    return { session };
  },
});

export const DELETE = createDeleteHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { id } = params;

    if (!id) {
      throw new ValidationError('Session ID is required');
    }

    const sessionsService = await createSessionsService();
    await sessionsService.deleteSession(parseInt(id));

    return { message: 'Session deleted successfully' };
  },
});

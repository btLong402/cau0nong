import { createPostHandler, createGetHandler } from '@/shared/api';
import { createSessionsService } from '@/modules/sessions/sessions.service';
import { ValidationError, NotFoundError } from '@/shared/api/base-errors';

interface Params {
  monthId: string;
  id: string;
}

export const POST = createPostHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { id } = params;
    const { records } = await req.json();

    if (!id) {
      throw new ValidationError('Session ID is required');
    }

    if (!Array.isArray(records) || records.length === 0) {
      throw new ValidationError('records must be a non-empty array');
    }

    const sessionsService = await createSessionsService();
    
    // Validate session exists
    const session = await sessionsService.getSession(parseInt(id));
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Record attendance
    const attendance = await sessionsService.recordAttendance(parseInt(id), records);

    return { attendance };
  },
});

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

    const attendance = await sessionsService.getSessionAttendance(parseInt(id));

    return { attendance };
  },
});

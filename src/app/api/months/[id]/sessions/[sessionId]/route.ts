import { createGetHandler, createPutHandler, createDeleteHandler } from '@/shared/api';
import { createSessionsService } from '@/modules/sessions/sessions.service';
import { ValidationError } from '@/shared/api/base-errors';

function parseSessionId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const sessionId = Number(segments[segments.length - 1]);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw new ValidationError('Session ID is required');
  }

  return sessionId;
}

export const GET = createGetHandler({
  handler: async (req) => {
    const sessionId = parseSessionId(req.url);
    const sessionsService = await createSessionsService();
    const session = await sessionsService.getSession(sessionId);

    return { session };
  },
});

export const PUT = createPutHandler({
  handler: async (req) => {
    const sessionId = parseSessionId(req.url);
    const data = await req.json();

    const sessionsService = await createSessionsService();
    const session = await sessionsService.updateSession(sessionId, data);

    return { session };
  },
});

export const DELETE = createDeleteHandler({
  handler: async (req) => {
    const sessionId = parseSessionId(req.url);
    const sessionsService = await createSessionsService();
    await sessionsService.deleteSession(sessionId);

    return { message: 'Session deleted successfully' };
  },
});

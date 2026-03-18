import { createPostHandler, createGetHandler } from '@/shared/api';
import { createSessionsService } from '@/modules/sessions/sessions.service';
import { ValidationError } from '@/shared/api/base-errors';

function parseSessionId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const sessionId = Number(segments[segments.length - 2]);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw new ValidationError('Session ID is required');
  }

  return sessionId;
}

export const POST = createPostHandler({
  handler: async (req) => {
    const sessionId = parseSessionId(req.url);
    const { records } = await req.json();

    if (!Array.isArray(records) || records.length === 0) {
      throw new ValidationError('records must be a non-empty array');
    }

    const sessionsService = await createSessionsService();
    await sessionsService.getSession(sessionId);

    // Record attendance
    const attendance = await sessionsService.recordAttendance(sessionId, records);

    return { attendance };
  },
});

export const GET = createGetHandler({
  handler: async (req) => {
    const sessionId = parseSessionId(req.url);
    const sessionsService = await createSessionsService();
    await sessionsService.getSession(sessionId);

    const attendance = await sessionsService.getSessionAttendance(sessionId);

    return { attendance };
  },
});

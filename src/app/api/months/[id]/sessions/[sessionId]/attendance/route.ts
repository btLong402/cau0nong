import { createPostHandler, createGetHandler } from '@/shared/api';
import { createSessionsService } from '@/modules/sessions/sessions.service';
import { ValidationError } from '@/shared/api/base-errors';

type AttendanceRequestRecord = {
  userId?: unknown;
  isAttended?: unknown;
  user_id?: unknown;
  is_attended?: unknown;
};

function parseSessionId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const sessionId = Number(segments[segments.length - 2]);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw new ValidationError('Thiếu ID buổi tập');
  }

  return sessionId;
}

export const POST = createPostHandler({
  handler: async (req) => {
    const sessionId = parseSessionId(req.url);
    const { records } = await req.json();

    if (!Array.isArray(records) || records.length === 0) {
      throw new ValidationError('records phải là mảng không rỗng');
    }

    const normalizedRecords = records.map((record: AttendanceRequestRecord, index: number) => {
      const userId =
        typeof record?.userId === 'string'
          ? record.userId
          : typeof record?.user_id === 'string'
            ? record.user_id
            : '';
      const isAttended =
        typeof record?.isAttended === 'boolean'
          ? record.isAttended
          : typeof record?.is_attended === 'boolean'
            ? record.is_attended
            : null;

      if (!userId.trim()) {
        throw new ValidationError(`records[${index}].user_id không hợp lệ`);
      }

      if (isAttended === null) {
        throw new ValidationError(`records[${index}].is_attended phải là boolean`);
      }

      return { userId, isAttended };
    });

    const sessionsService = await createSessionsService();
    await sessionsService.getSession(sessionId);

    // Record attendance
    const attendance = await sessionsService.recordAttendance(sessionId, normalizedRecords);

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

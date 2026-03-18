import { createGetHandler, createPostHandler } from '@/shared/api';
import { createSessionsService } from '@/modules/sessions/sessions.service';
import { ValidationError } from '@/shared/api/base-errors';

function parseMonthId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const monthId = Number(segments[segments.length - 2]);

  if (!Number.isInteger(monthId) || monthId <= 0) {
    throw new ValidationError('Month ID is required');
  }

  return monthId;
}

export const GET = createGetHandler({
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    const sessionsService = await createSessionsService();
    const sessions = await sessionsService.listSessionsByMonth(monthId);

    return { sessions };
  },
});

export const POST = createPostHandler({
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    const { session_date, court_expense_amount, payer_user_id, notes } = await req.json();

    if (!session_date || !court_expense_amount || !payer_user_id) {
      throw new ValidationError('Missing required fields: session_date, court_expense_amount, payer_user_id');
    }

    const sessionsService = await createSessionsService();
    const session = await sessionsService.createSession({
      month_id: monthId,
      session_date,
      court_expense_amount,
      payer_user_id,
      notes,
    });

    return { session };
  },
});

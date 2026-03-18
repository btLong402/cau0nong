import { createGetHandler, createPostHandler } from '@/shared/api';
import { createSessionsService } from '@/modules/sessions/sessions.service';
import { ValidationError, NotFoundError } from '@/shared/api/base-errors';

interface Params {
  monthId: string;
}

export const GET = createGetHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { monthId } = params;

    if (!monthId) {
      throw new ValidationError('Month ID is required');
    }

    const sessionsService = await createSessionsService();
    const sessions = await sessionsService.listSessionsByMonth(parseInt(monthId));

    return { sessions };
  },
});

export const POST = createPostHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { monthId } = params;
    const { session_date, court_expense_amount, payer_user_id, notes } = await req.json();

    if (!monthId) {
      throw new ValidationError('Month ID is required');
    }

    if (!session_date || !court_expense_amount || !payer_user_id) {
      throw new ValidationError('Missing required fields: session_date, court_expense_amount, payer_user_id');
    }

    const sessionsService = await createSessionsService();
    const session = await sessionsService.createSession(
      parseInt(monthId),
      session_date,
      court_expense_amount,
      payer_user_id,
      notes,
    );

    return { session };
  },
});

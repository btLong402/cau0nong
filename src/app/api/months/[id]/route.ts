import { createGetHandler, createPutHandler } from '@/shared/api';
import { createMonthsService } from '@/modules/months/months.service';
import { ValidationError } from '@/shared/api/base-errors';

function parseMonthId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const monthId = Number(segments[segments.length - 1]);

  if (!Number.isInteger(monthId) || monthId <= 0) {
    throw new ValidationError('Thiếu ID tháng');
  }

  return monthId;
}

export const GET = createGetHandler({
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    const monthsService = await createMonthsService();
    const month = await monthsService.getMonth(monthId);

    return { month };
  },
});

export const PUT = createPutHandler({
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    const data = await req.json();

    const monthsService = await createMonthsService();
    await monthsService.getMonth(monthId);

    // Update shuttlecock expense if provided
    if (data.total_shuttlecock_expense !== undefined) {
      await monthsService.updateShuttlecockExpense(monthId, data.total_shuttlecock_expense);
    }

    const updatedMonth = await monthsService.getMonth(monthId);
    return { month: updatedMonth };
  },
});

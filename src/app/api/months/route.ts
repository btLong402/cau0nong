import { createGetHandler, createPostHandler } from '@/shared/api';
import { createMonthsService } from '@/modules/months/months.service';
import { ValidationError } from '@/shared/api/base-errors';

export const GET = createGetHandler({
  handler: async (req) => {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') as 'open' | 'closed' | undefined;

    const monthsService = await createMonthsService();
    const months = await monthsService.listMonths({ status });

    return { months };
  },
});

export const POST = createPostHandler({
  handler: async (req) => {
    const { month_year, status } = await req.json();

    if (!month_year) {
      throw new ValidationError('month_year is required (format: YYYY-MM-01)');
    }

    const monthsService = await createMonthsService();
    const month = await monthsService.createMonth({
      month_year,
      status: status || 'open',
    });

    return { month };
  },
});

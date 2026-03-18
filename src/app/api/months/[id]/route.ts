import { createGetHandler, createPutHandler } from '@/shared/api';
import { createMonthsService } from '@/modules/months/months.service';
import { NotFoundError, ValidationError } from '@/shared/api/base-errors';

interface Params {
  id: string;
}

export const GET = createGetHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { id } = params;

    if (!id) {
      throw new ValidationError('Month ID is required');
    }

    const monthsService = await createMonthsService();
    const month = await monthsService.getMonth(parseInt(id));

    if (!month) {
      throw new NotFoundError('Month not found');
    }

    return { month };
  },
});

export const PUT = createPutHandler({
  handler: async (req, { params }: { params: Params }) => {
    const { id } = params;
    const data = await req.json();

    if (!id) {
      throw new ValidationError('Month ID is required');
    }

    const monthsService = await createMonthsService();
    const month = await monthsService.getMonth(parseInt(id));

    if (!month) {
      throw new NotFoundError('Month not found');
    }

    // Update shuttlecock expense if provided
    if (data.total_shuttlecock_expense !== undefined) {
      await monthsService.updateShuttlecockExpense(parseInt(id), data.total_shuttlecock_expense);
    }

    const updatedMonth = await monthsService.getMonth(parseInt(id));
    return { month: updatedMonth };
  },
});

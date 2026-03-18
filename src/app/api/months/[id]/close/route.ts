import { createPutHandler } from '@/shared/api';
import { createMonthsService } from '@/modules/months/months.service';
import { NotFoundError, ValidationError, InvalidStateError } from '@/shared/api/base-errors';

interface Params {
  id: string;
}

export const PUT = createPutHandler({
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

    if (month.status === 'closed') {
      throw new InvalidStateError('Month is already closed');
    }

    const closedMonth = await monthsService.closeMonth(parseInt(id));

    return { month: closedMonth };
  },
});

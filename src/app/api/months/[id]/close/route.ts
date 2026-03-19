import { createPutHandler } from '@/shared/api';
import { createMonthsService } from '@/modules/months/months.service';
import { createSettlementsService } from '@/modules/settlements/settlements.service';
import { NotFoundError, ValidationError, InvalidStateError } from '@/shared/api/base-errors';

function parseMonthId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const id = Number(segments[segments.length - 2]);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Thiếu ID tháng');
  }

  return id;
}

export const PUT = createPutHandler({
  requireAuth: true,
  requireRole: ['admin'],
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    const url = new URL(req.url);
    const autoGenerate = url.searchParams.get('autoGenerate') !== 'false';
    let force = false;

    try {
      const payload = await req.json();
      force = Boolean(payload?.force);
    } catch {
      force = false;
    }

    const monthsService = await createMonthsService();
    const month = await monthsService.getMonth(monthId);

    if (!month) {
      throw new NotFoundError('Không tìm thấy tháng');
    }

    if (month.status === 'closed') {
      throw new InvalidStateError('Tháng đã được đóng');
    }

    const closedMonth = await monthsService.closeMonth(monthId);
    let settlementSummary = null;

    if (autoGenerate) {
      const settlementsService = await createSettlementsService();
      settlementSummary = await settlementsService.generateForMonth(monthId, { force });
    }

    return {
      month: closedMonth,
      settlementSummary,
      autoGenerate,
    };
  },
});

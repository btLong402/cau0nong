import {
  confirmSettlementPaymentSchema,
  createPutHandler,
} from "@/shared/api";
import { ValidationError } from "@/shared/api/base-errors";
import { createSettlementsService } from "@/modules/settlements/settlements.service";

function parseSettlementId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const id = Number(segments[segments.length - 2]);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("ID quyết toán không hợp lệ");
  }

  return id;
}

export const PUT = createPutHandler({
  requireAuth: true,
  requireRole: ["admin"],
  validationSchema: confirmSettlementPaymentSchema,
  handler: async (req, _context, payload) => {
    const settlementId = parseSettlementId(req.url);
    const paidAmount = payload?.paid_amount;

    const settlementsService = await createSettlementsService();
    const settlement = await settlementsService.markPaid(settlementId, paidAmount);

    return { settlement };
  },
});

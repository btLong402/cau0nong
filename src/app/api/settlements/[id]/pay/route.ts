import { createPutHandler } from "@/shared/api";
import { ValidationError } from "@/shared/api/base-errors";
import { createSettlementsService } from "@/modules/settlements/settlements.service";

function parseSettlementId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const id = Number(segments[segments.length - 2]);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("Invalid settlement ID");
  }

  return id;
}

export const PUT = createPutHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const settlementId = parseSettlementId(req.url);
    let paidAmount: number | undefined;

    try {
      const payload = await req.json();
      if (payload?.paid_amount !== undefined) {
        paidAmount = Number(payload.paid_amount);
      }
    } catch {
      paidAmount = undefined;
    }

    const settlementsService = await createSettlementsService();
    const settlement = await settlementsService.markPaid(settlementId, paidAmount);

    return { settlement };
  },
});

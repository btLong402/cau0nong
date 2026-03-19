import { createGetHandler } from "@/shared/api";
import { ValidationError } from "@/shared/api/base-errors";
import { createSettlementsService } from "@/modules/settlements/settlements.service";

function parseSettlementId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const id = Number(segments[segments.length - 1]);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("ID quyết toán không hợp lệ");
  }

  return id;
}

export const GET = createGetHandler({
  requireAuth: true,
  handler: async (req) => {
    const settlementId = parseSettlementId(req.url);
    const settlementsService = await createSettlementsService();
    const settlement = await settlementsService.getById(settlementId);

    return { settlement };
  },
});

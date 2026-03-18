import { createGetHandler } from "@/shared/api";
import { ValidationError } from "@/shared/api/base-errors";
import { createPaymentsService } from "@/modules/payments";

function parseSettlementId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const id = Number(segments[segments.length - 2]);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("Invalid settlement ID");
  }

  return id;
}

export const GET = createGetHandler({
  requireAuth: true,
  handler: async (req) => {
    const settlementId = parseSettlementId(req.url);
    const paymentsService = await createPaymentsService();
    const generated = await paymentsService.createOrReuseSettlementVietQR(settlementId);

    return {
      vietqr: generated,
    };
  },
});

import { createGetHandler, createPostHandler } from "@/shared/api";
import { ValidationError } from "@/shared/api/base-errors";
import { createShuttlecocksService } from "@/modules/shuttlecocks/shuttlecocks.service";

function parseMonthId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // URL: /api/months/[id]/shuttlecocks
  const monthId = Number(segments[segments.length - 2]);

  if (!Number.isInteger(monthId) || monthId <= 0) {
    throw new ValidationError("Invalid month ID");
  }

  return monthId;
}

export const GET = createGetHandler({
  requireAuth: true,
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    const service = await createShuttlecocksService();
    const items = await service.listByMonth(monthId);
    return { items };
  },
});

export const POST = createPostHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    const payload = await req.json();

    if (!payload.purchase_date || !payload.quantity || !payload.unit_price || !payload.buyer_user_id) {
      throw new ValidationError("Missing required fields");
    }

    const service = await createShuttlecocksService();
    const item = await service.addPurchase({
      month_id: monthId,
      purchase_date: payload.purchase_date,
      quantity: Number(payload.quantity),
      unit_price: Number(payload.unit_price),
      buyer_user_id: payload.buyer_user_id,
      notes: payload.notes,
    });

    return { item };
  },
});

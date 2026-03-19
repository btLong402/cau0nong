import { createGetHandler, createPostHandler } from "@/shared/api";
import { ValidationError } from "@/shared/api/base-errors";
import { createShuttlecocksService } from "@/modules/shuttlecocks/shuttlecocks.service";

export const GET = createGetHandler({
  requireAuth: true,
  handler: async (req, context) => {
    const { id } = await context.params;
    const monthId = Number(id);
    if (!monthId || isNaN(monthId)) throw new ValidationError("ID tháng không hợp lệ");

    const service = await createShuttlecocksService();
    const items = await service.listByMonth(monthId);
    return { items };
  },
});

export const POST = createPostHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req, context) => {
    const { id } = await context.params;
    const monthId = Number(id);
    if (!monthId || isNaN(monthId)) throw new ValidationError("ID tháng không hợp lệ");

    const payload = await req.json();

    if (!payload.purchase_date || !payload.quantity || !payload.unit_price || !payload.buyer_user_id) {
      throw new ValidationError("Thiếu các trường bắt buộc");
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

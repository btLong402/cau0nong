import { createDeleteHandler, createPatchHandler } from "@/shared/api";
import { ValidationError } from "@/shared/api/base-errors";
import { createShuttlecocksService } from "@/modules/shuttlecocks/shuttlecocks.service";

export const PATCH = createPatchHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req, context) => {
    const { id } = await context.params;
    const shuttlecockId = Number(id);
    if (!shuttlecockId || isNaN(shuttlecockId)) throw new ValidationError("Invalid ID");

    const payload = await req.json();
    const service = await createShuttlecocksService();
    const item = await service.updatePurchase(shuttlecockId, {
      purchase_date: payload.purchase_date,
      quantity: payload.quantity ? Number(payload.quantity) : undefined,
      unit_price: payload.unit_price ? Number(payload.unit_price) : undefined,
      buyer_user_id: payload.buyer_user_id,
      notes: payload.notes,
    });

    return { item };
  },
});

export const DELETE = createDeleteHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req, context) => {
    const { id } = await context.params;
    const shuttlecockId = Number(id);
    if (!shuttlecockId || isNaN(shuttlecockId)) throw new ValidationError("Invalid ID");

    const service = await createShuttlecocksService();
    await service.deletePurchase(shuttlecockId);
    return { success: true };
  },
});

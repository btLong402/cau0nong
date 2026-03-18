import { createDeleteHandler, createPatchHandler } from "@/shared/api";
import { ValidationError } from "@/shared/api/base-errors";
import { createShuttlecocksService } from "@/modules/shuttlecocks/shuttlecocks.service";

function parseId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const id = Number(segments[segments.length - 1]);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("Invalid ID");
  }

  return id;
}

export const PATCH = createPatchHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const id = parseId(req.url);
    const payload = await req.json();

    const service = await createShuttlecocksService();
    const item = await service.updatePurchase(id, {
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
  handler: async (req) => {
    const id = parseId(req.url);
    const service = await createShuttlecocksService();
    await service.deletePurchase(id);
    return { success: true };
  },
});

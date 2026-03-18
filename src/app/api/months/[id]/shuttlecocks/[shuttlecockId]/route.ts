import {
  createPutHandler,
  createDeleteHandler,
} from "@/shared/api";
import { createShuttlecocksService } from "@/modules/shuttlecocks/shuttlecocks.service";
import { ValidationError } from "@/shared/api/base-errors";

function parseIds(url: string): { monthId: number; shuttlecockId: number } {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/months/[id]/shuttlecocks/[shuttlecockId]
  const monthIdx = segments.indexOf("months");
  const monthId = Number(segments[monthIdx + 1]);
  const shuttlecockId = Number(segments[segments.length - 1]);

  if (!Number.isInteger(monthId) || monthId <= 0) {
    throw new ValidationError("Month ID is required");
  }
  if (!Number.isInteger(shuttlecockId) || shuttlecockId <= 0) {
    throw new ValidationError("Shuttlecock ID is required");
  }

  return { monthId, shuttlecockId };
}

export const PUT = createPutHandler({
  handler: async (req) => {
    const { shuttlecockId } = parseIds(req.url);
    const data = await req.json();

    const service = await createShuttlecocksService();
    const shuttlecock = await service.updateDetail(shuttlecockId, {
      purchase_date: data.purchase_date,
      quantity: data.quantity,
      unit_price: data.unit_price,
      buyer_user_id: data.buyer_user_id,
      notes: data.notes,
    });

    return { shuttlecock };
  },
});

export const DELETE = createDeleteHandler({
  handler: async (req) => {
    const { shuttlecockId } = parseIds(req.url);

    const service = await createShuttlecocksService();
    await service.deleteDetail(shuttlecockId);

    return { deleted: true };
  },
});

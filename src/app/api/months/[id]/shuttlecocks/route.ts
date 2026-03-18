import { createGetHandler, createPostHandler } from "@/shared/api";
import { createShuttlecocksService } from "@/modules/shuttlecocks/shuttlecocks.service";
import { ValidationError } from "@/shared/api/base-errors";

function parseMonthId(url: string): number {
  const pathname = new URL(url).pathname;
  // /api/months/[id]/shuttlecocks → segments = ["api","months","[id]","shuttlecocks"]
  const segments = pathname.split("/").filter(Boolean);
  const monthIdx = segments.indexOf("months");
  const monthId = Number(segments[monthIdx + 1]);

  if (!Number.isInteger(monthId) || monthId <= 0) {
    throw new ValidationError("Month ID is required");
  }

  return monthId;
}

export const GET = createGetHandler({
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    const service = await createShuttlecocksService();
    const shuttlecocks = await service.listByMonth(monthId);

    return { shuttlecocks };
  },
});

export const POST = createPostHandler({
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    const { purchase_date, quantity, unit_price, buyer_user_id, notes } =
      await req.json();

    if (!purchase_date || !quantity || !unit_price || !buyer_user_id) {
      throw new ValidationError(
        "Missing required fields: purchase_date, quantity, unit_price, buyer_user_id"
      );
    }

    const service = await createShuttlecocksService();
    const shuttlecock = await service.createDetail({
      month_id: monthId,
      purchase_date,
      quantity,
      unit_price,
      buyer_user_id,
      notes,
    });

    return { shuttlecock };
  },
});

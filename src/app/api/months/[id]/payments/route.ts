import { createGetHandler } from "@/shared/api";
import { ValidationError } from "@/shared/api/base-errors";
import { createPaymentsService } from "@/modules/payments";

function parseMonthId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const monthId = Number(segments[segments.length - 2]);

  if (!Number.isInteger(monthId) || monthId <= 0) {
    throw new ValidationError("ID tháng không hợp lệ");
  }

  return monthId;
}

export const GET = createGetHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    const url = new URL(req.url);

    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || undefined;
    const status =
      (url.searchParams.get("status") as "all" | "paid" | "unpaid" | null) ||
      "all";

    const paymentsService = await createPaymentsService();
    const result = await paymentsService.listByMonth(monthId, {
      page,
      limit,
      search,
      status,
    });

    return result;
  },
});

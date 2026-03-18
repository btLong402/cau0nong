import { createGetHandler, createPostHandler } from "@/shared/api";
import { ValidationError } from "@/shared/api/base-errors";
import { createSettlementsService } from "@/modules/settlements/settlements.service";

function parseMonthId(url: string): number {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
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
    const url = new URL(req.url);

    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "20");
    const status =
      (url.searchParams.get("status") as "all" | "paid" | "unpaid" | null) ||
      "all";
    const search = url.searchParams.get("search") || undefined;
    const sortBy =
      (url.searchParams.get("sortBy") as
        | "total_due"
        | "created_at"
        | "paid_at"
        | "user_id"
        | null) || "total_due";
    const sortOrder =
      (url.searchParams.get("sortOrder") as "asc" | "desc" | null) || "desc";

    const settlementsService = await createSettlementsService();
    const result = await settlementsService.listByMonthPaginated(monthId, {
      page,
      limit,
      status,
      search,
      sortBy,
      sortOrder,
    });

    return result;
  },
});

export const POST = createPostHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const monthId = parseMonthId(req.url);
    let force = false;

    try {
      const payload = await req.json();
      force = Boolean(payload?.force);
    } catch {
      force = false;
    }

    const settlementsService = await createSettlementsService();
    const summary = await settlementsService.generateForMonth(monthId, { force });

    return { summary };
  },
});

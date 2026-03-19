/**
 * Events List & Create API
 * GET /api/events — list events (paginated)
 * POST /api/events — create event (admin only)
 */

import { createGetHandler, createPostHandler } from "@/shared/api";
import { createEventsService } from "@/modules/events/events.service";
import { ValidationError } from "@/shared/api/base-errors";

export const GET = createGetHandler({
  handler: async (req) => {
    const url = new URL(req.url);
    const service = await createEventsService();

    const result = await service.listEvents({
      page: Number(url.searchParams.get("page")) || undefined,
      limit: Number(url.searchParams.get("limit")) || undefined,
      search: url.searchParams.get("search") || undefined,
      sortBy: (url.searchParams.get("sortBy") as any) || undefined,
      sortOrder: (url.searchParams.get("sortOrder") as any) || undefined,
    });

    return result;
  },
});

export const POST = createPostHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const body = await req.json();

    if (!body.event_name) {
      throw new ValidationError("event_name is required");
    }
    if (!body.event_date) {
      throw new ValidationError("event_date is required");
    }

    const service = await createEventsService();
    const event = await service.createEvent({
      event_name: body.event_name,
      event_date: body.event_date,
      total_support: Number(body.total_support) || 0,
      total_expense: Number(body.total_expense) || 0,
      month_id: body.month_id ? Number(body.month_id) : undefined,
    });

    return { event };
  },
});

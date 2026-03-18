/**
 * Single Event API
 * GET /api/events/:id — get event with participants
 * PUT /api/events/:id — update event (admin only)
 * DELETE /api/events/:id — delete event (admin only)
 */

import {
  createGetHandler,
  createPutHandler,
  createDeleteHandler,
} from "@/shared/api";
import { createEventsService } from "@/modules/events/events.service";
import { ValidationError } from "@/shared/api/base-errors";

function extractEventId(req: Request): number {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const id = Number(segments[segments.length - 1]);
  if (!id || isNaN(id)) throw new ValidationError("Invalid event ID");
  return id;
}

export const GET = createGetHandler({
  handler: async (req) => {
    const id = extractEventId(req);
    const service = await createEventsService();
    const event = await service.getEventWithParticipants(id);
    return { event };
  },
});

export const PUT = createPutHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const id = extractEventId(req);
    const body = await req.json();
    const service = await createEventsService();

    const event = await service.updateEvent(id, {
      event_name: body.event_name,
      event_date: body.event_date,
      total_support:
        body.total_support !== undefined
          ? Number(body.total_support)
          : undefined,
      total_expense:
        body.total_expense !== undefined
          ? Number(body.total_expense)
          : undefined,
    });

    return { event };
  },
});

export const DELETE = createDeleteHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const id = extractEventId(req);
    const service = await createEventsService();
    await service.deleteEvent(id);
    return { deleted: true };
  },
});

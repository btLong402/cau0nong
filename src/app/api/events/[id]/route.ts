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

export const GET = createGetHandler({
  handler: async (req, context) => {
    const { id } = await context.params;
    const eventId = Number(id);
    if (!eventId) throw new ValidationError("Invalid event ID");

    const service = await createEventsService();
    const event = await service.getEventWithParticipants(eventId);
    return { event };
  },
});

export const PUT = createPutHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req, context) => {
    const { id } = await context.params;
    const eventId = Number(id);
    if (!eventId) throw new ValidationError("Invalid event ID");

    const body = await req.json();
    const service = await createEventsService();

    const event = await service.updateEvent(eventId, {
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
      month_id: body.month_id !== undefined ? Number(body.month_id) : undefined,
    });

    return { event };
  },
});

export const DELETE = createDeleteHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req, context) => {
    const { id } = await context.params;
    const eventId = Number(id);
    if (!eventId) throw new ValidationError("Invalid event ID");

    const service = await createEventsService();
    await service.deleteEvent(eventId);
    return { deleted: true };
  },
});

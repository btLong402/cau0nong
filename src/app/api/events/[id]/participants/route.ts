/**
 * Event Participants API
 * GET /api/events/:id/participants — list participants
 * POST /api/events/:id/participants — add participants
 */

import { createGetHandler, createPostHandler } from "@/shared/api";
import { createEventsService } from "@/modules/events/events.service";
import { ValidationError } from "@/shared/api/base-errors";

function extractEventId(req: Request): number {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  // URL: /api/events/:id/participants → id is at index -2
  const id = Number(segments[segments.length - 2]);
  if (!id || isNaN(id)) throw new ValidationError("ID sự kiện không hợp lệ");
  return id;
}

export const GET = createGetHandler({
  handler: async (req) => {
    const eventId = extractEventId(req);
    const service = await createEventsService();
    const event = await service.getEventWithParticipants(eventId);
    return { participants: event.participants };
  },
});

export const POST = createPostHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const eventId = extractEventId(req);
    const body = await req.json();

    if (!body.userIds || !Array.isArray(body.userIds) || !body.userIds.length) {
      throw new ValidationError("userIds phải là mảng không rỗng");
    }

    const service = await createEventsService();
    const participants = await service.addParticipants(eventId, body.userIds);
    return { participants };
  },
});

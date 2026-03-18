/**
 * Single Event Participant API
 * PUT /api/events/:id/participants/:userId — mark paid
 * DELETE /api/events/:id/participants/:userId — remove participant
 */

import { createPutHandler, createDeleteHandler } from "@/shared/api";
import { createEventsService } from "@/modules/events/events.service";
import { ValidationError } from "@/shared/api/base-errors";

function extractParams(req: Request): { eventId: number; userId: string } {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  // URL: /api/events/:id/participants/:userId
  const userId = segments[segments.length - 1];
  const eventId = Number(segments[segments.length - 3]);

  if (!eventId || isNaN(eventId)) {
    throw new ValidationError("Invalid event ID");
  }
  if (!userId) {
    throw new ValidationError("Invalid userId");
  }

  return { eventId, userId };
}

export const PUT = createPutHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const { eventId, userId } = extractParams(req);
    const service = await createEventsService();
    const participant = await service.markParticipantPaid(eventId, userId);
    return { participant };
  },
});

export const DELETE = createDeleteHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const { eventId, userId } = extractParams(req);
    const service = await createEventsService();
    await service.removeParticipant(eventId, userId);
    return { removed: true };
  },
});

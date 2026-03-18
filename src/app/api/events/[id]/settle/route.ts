/**
 * Event Settlement API
 * POST /api/events/:id/settle — calculate contribution per person
 */

import { createPostHandler } from "@/shared/api";
import { createEventsService } from "@/modules/events/events.service";
import { ValidationError } from "@/shared/api/base-errors";

function extractEventId(req: Request): number {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  // URL: /api/events/:id/settle → id is at index -2
  const id = Number(segments[segments.length - 2]);
  if (!id || isNaN(id)) throw new ValidationError("Invalid event ID");
  return id;
}

export const POST = createPostHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const eventId = extractEventId(req);
    const service = await createEventsService();
    const result = await service.settleEvent(eventId);
    return { settlement: result };
  },
});

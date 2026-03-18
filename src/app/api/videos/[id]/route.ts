/**
 * Single Video API
 * PUT /api/videos/:id — update video (admin only)
 * DELETE /api/videos/:id — delete video (admin only)
 */

import { createPutHandler, createDeleteHandler } from "@/shared/api";
import { createVideosService } from "@/modules/videos/videos.service";
import { ValidationError } from "@/shared/api/base-errors";

function extractVideoId(req: Request): number {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const id = Number(segments[segments.length - 1]);
  if (!id || isNaN(id)) throw new ValidationError("Invalid video ID");
  return id;
}

export const PUT = createPutHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const id = extractVideoId(req);
    const body = await req.json();
    const service = await createVideosService();

    const video = await service.updateVideo(id, {
      title: body.title,
      youtube_url: body.youtube_url,
      description: body.description,
      category: body.category,
    });

    return { video };
  },
});

export const DELETE = createDeleteHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req) => {
    const id = extractVideoId(req);
    const service = await createVideosService();
    await service.deleteVideo(id);
    return { deleted: true };
  },
});

/**
 * Single Video API
 * PUT /api/videos/:id — update video (admin only)
 * DELETE /api/videos/:id — delete video (admin only)
 */

import { createPutHandler, createDeleteHandler } from "@/shared/api";
import { createVideosService } from "@/modules/videos/videos.service";
import { ValidationError } from "@/shared/api/base-errors";

export const PUT = createPutHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req, context) => {
    const { id } = await context.params;
    const videoId = Number(id);
    if (!videoId || isNaN(videoId)) throw new ValidationError("Invalid video ID");

    const body = await req.json();
    const service = await createVideosService();

    const video = await service.updateVideo(videoId, {
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
  handler: async (req, context) => {
    const { id } = await context.params;
    const videoId = Number(id);
    if (!videoId || isNaN(videoId)) throw new ValidationError("Invalid video ID");

    const service = await createVideosService();
    await service.deleteVideo(videoId);
    return { deleted: true };
  },
});

/**
 * Videos List & Create API
 * GET /api/videos?category=... — list videos
 * POST /api/videos — create video (admin only)
 */

import { createGetHandler, createPostHandler } from "@/shared/api";
import { createVideosService } from "@/modules/videos/videos.service";

export const GET = createGetHandler({
  handler: async (req) => {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || undefined;

    const service = await createVideosService();
    const videos = await service.listVideos(category);

    return { videos };
  },
});

export const POST = createPostHandler({
  requireAuth: true,
  requireRole: ["admin"],
  handler: async (req, context) => {
    const body = await req.json();
    const service = await createVideosService();

    const video = await service.createVideo(
      {
        title: body.title,
        youtube_url: body.youtube_url,
        description: body.description,
        category: body.category,
      },
      context.auth?.userId
    );

    return { video };
  },
});

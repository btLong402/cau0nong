/**
 * Videos Service
 * Business logic for video management
 */

import { NotFoundError, ValidationError } from "@/shared/api";
import {
  VideosRepository,
  createVideosRepository,
} from "./videos.repository";
import type { CreateVideoData, UpdateVideoData, Video } from "./types";

const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)/;

function validateYouTubeUrl(url: string) {
  if (!YOUTUBE_URL_REGEX.test(url)) {
    throw new ValidationError(
      "youtube_url must be a valid YouTube URL"
    );
  }
}

export class VideosService {
  constructor(private repository: VideosRepository) {}

  async listVideos(category?: string): Promise<Video[]> {
    return this.repository.findVideos(category);
  }

  async getVideo(id: number): Promise<Video> {
    const video = await this.repository.findById(id);
    if (!video) throw new NotFoundError("Video");
    return video;
  }

  async createVideo(data: CreateVideoData, userId?: string): Promise<Video> {
    if (!data.title?.trim()) {
      throw new ValidationError("title is required");
    }
    if (!data.youtube_url?.trim()) {
      throw new ValidationError("youtube_url is required");
    }
    validateYouTubeUrl(data.youtube_url);

    return this.repository.createVideo({
      title: data.title.trim(),
      youtube_url: data.youtube_url.trim(),
      description: data.description?.trim(),
      category: data.category || "general",
      created_by: userId,
    });
  }

  async updateVideo(id: number, data: UpdateVideoData): Promise<Video> {
    await this.getVideo(id); // ensures exists

    if (data.youtube_url) {
      validateYouTubeUrl(data.youtube_url);
    }

    return this.repository.updateVideo(id, data);
  }

  async deleteVideo(id: number): Promise<boolean> {
    await this.getVideo(id);
    return this.repository.deleteVideo(id);
  }
}

export async function createVideosService(): Promise<VideosService> {
  const repository = await createVideosRepository();
  return new VideosService(repository);
}

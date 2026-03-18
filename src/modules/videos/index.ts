/**
 * Videos Module — Barrel Exports
 */

export { VideosService, createVideosService } from "./videos.service";
export { VideosRepository, createVideosRepository } from "./videos.repository";
export type {
  Video,
  CreateVideoData,
  UpdateVideoData,
  VideoCategory,
} from "./types";
export { VIDEO_CATEGORIES } from "./types";

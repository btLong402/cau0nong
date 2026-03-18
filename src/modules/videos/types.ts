/**
 * Videos Module Types
 */

export interface Video {
  id: number;
  title: string;
  youtube_url: string;
  description?: string;
  category: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVideoData {
  title: string;
  youtube_url: string;
  description?: string;
  category?: string;
}

export interface UpdateVideoData {
  title?: string;
  youtube_url?: string;
  description?: string;
  category?: string;
}

export const VIDEO_CATEGORIES = [
  'general',
  'ky-thuat',
  'the-luc',
  'chien-thuat',
  'luat',
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

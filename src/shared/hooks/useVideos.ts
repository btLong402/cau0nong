/**
 * Videos Hook
 * Fetches video list with optional category filter
 */

import { useFetch } from './useFetch';
import type { Video } from '@/modules/videos/types';

export function useVideos(category?: string) {
  const params = category && category !== 'all' ? `?category=${category}` : '';
  return useFetch<{ videos: Video[] }>(`/api/videos${params}`);
}

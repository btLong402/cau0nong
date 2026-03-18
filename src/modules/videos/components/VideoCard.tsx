/**
 * VideoCard Component
 * Displays YouTube video thumbnail with play-on-click
 */

'use client';

import { useState } from 'react';
import type { Video } from '../types';

interface VideoCardProps {
  video: Video;
  onEdit?: (video: Video) => void;
  onDelete?: (id: number) => void;
  isAdmin?: boolean;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
    /youtu\.be\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Chung',
  'ky-thuat': 'Ky thuat',
  'the-luc': 'The luc',
  'chien-thuat': 'Chien thuat',
  luat: 'Luat',
};

export function VideoCard({ video, onEdit, onDelete, isAdmin }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractYouTubeId(video.youtube_url);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
      {/* Thumbnail or Embed */}
      <div className="relative aspect-video bg-slate-900">
        {playing && videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={video.title}
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex cursor-pointer items-center justify-center"
            aria-label={`Phat video: ${video.title}`}
          >
            {videoId ? (
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt={video.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-800">
                <span className="text-sm text-slate-400">Video</span>
              </div>
            )}
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
                <svg
                  className="ml-1 h-6 w-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
            {video.title}
          </h3>
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {CATEGORY_LABELS[video.category] || video.category}
          </span>
        </div>

        {video.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
            {video.description}
          </p>
        )}

        {isAdmin && (
          <div className="mt-3 flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(video)}
                className="text-xs font-medium text-blue-700 hover:text-blue-900"
              >
                Sua
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(video.id)}
                className="text-xs font-medium text-red-600 hover:text-red-800"
              >
                Xoa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

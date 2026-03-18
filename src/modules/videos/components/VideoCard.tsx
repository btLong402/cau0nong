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
  'ky-thuat': 'Kỹ thuật',
  'the-luc': 'Thể lực',
  'chien-thuat': 'Chiến thuật',
  luat: 'Luật',
};

export function VideoCard({ video, onEdit, onDelete, isAdmin }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractYouTubeId(video.youtube_url);

  return (
    <div className="surface-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Thumbnail or Embed */}
      <div className="relative aspect-video bg-[var(--surface-bg)]">
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
            aria-label={`Phát video: ${video.title}`}
          >
            {videoId ? (
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt={video.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--surface-hover)]">
                <span className="text-sm text-[var(--muted)]">Video</span>
              </div>
            )}
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] shadow-lg transition-transform group-hover:scale-110">
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
          <h3 className="line-clamp-2 text-sm font-semibold text-[var(--foreground)]">
            {video.title}
          </h3>
          <span className="badge badge-info shrink-0">
            {CATEGORY_LABELS[video.category] || video.category}
          </span>
        </div>

        {video.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-[var(--muted)]">
            {video.description}
          </p>
        )}

        {isAdmin && (
          <div className="mt-3 flex gap-3">
            {onEdit && (
              <button
                onClick={() => onEdit(video)}
                className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer"
              >
                Sửa
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(video.id)}
                className="text-xs font-medium text-[var(--danger)] hover:opacity-80 cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

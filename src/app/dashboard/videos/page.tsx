/**
 * Videos Dashboard Page
 * Browse, add, and manage skill videos
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { VideoCard } from '@/modules/videos/components/VideoCard';
import { VideoForm } from '@/modules/videos/components/VideoForm';
import { VIDEO_CATEGORIES } from '@/modules/videos/types';
import type { Video } from '@/modules/videos/types';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Tất cả',
  general: 'Chung',
  'ky-thuat': 'Kỹ thuật',
  'the-luc': 'Thể lực',
  'chien-thuat': 'Chiến thuật',
  luat: 'Luật',
};

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const params = category !== 'all' ? `?category=${category}` : '';
      const res = await fetch(`/api/videos${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVideos(data.data?.videos || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  async function handleSubmit(formData: {
    title: string;
    youtube_url: string;
    description: string;
    category: string;
  }) {
    setFormLoading(true);
    try {
      const method = editingVideo ? 'PUT' : 'POST';
      const url = editingVideo
        ? `/api/videos/${editingVideo.id}`
        : '/api/videos';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      setShowForm(false);
      setEditingVideo(null);
      await fetchVideos();
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bạn có chắc muốn xóa video này?')) return;

    const res = await fetch(`/api/videos/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error?.message || 'Không thể xóa');
      return;
    }

    await fetchVideos();
  }

  // Loading state
  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  // Error state
  if (error && videos.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchVideos} className="btn-primary mt-4">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Thư viện video
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Video kỹ năng cầu lông — kỹ thuật, thể lực, chiến thuật.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVideo(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          Thêm video
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {['all', ...VIDEO_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="surface-card-soft p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editingVideo ? 'Cập nhật video' : 'Thêm video mới'}
          </h2>
          <VideoForm
            initialData={editingVideo || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingVideo(null);
            }}
            isEditing={!!editingVideo}
            loading={formLoading}
          />
        </div>
      )}

      {/* Video grid */}
      {videos.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-slate-500">Chưa có video nào</p>
          <p className="mt-1 text-sm text-slate-400">
            Nhấn &quot;Thêm video&quot; để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isAdmin
              onEdit={(v) => {
                setEditingVideo(v);
                setShowForm(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

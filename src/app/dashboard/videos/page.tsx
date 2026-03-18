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
      <div className="space-y-4">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-4 w-64" />
        <div className="flex gap-2 mt-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-8 w-20 rounded-full" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48" />)}
        </div>
      </div>
    );
  }

  // Error state
  if (error && videos.length === 0) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="empty-state-title text-[var(--danger)]">{error}</p>
        <button onClick={fetchVideos} className="btn-primary mt-4">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Thư viện video</h1>
          <p className="page-subtitle">
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
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              category === cat
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-hover)] text-[var(--muted)] hover:bg-[var(--surface-border)] hover:text-[var(--foreground)]'
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="surface-card-soft p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
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
        <div className="empty-state py-12">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
          </svg>
          <p className="empty-state-title">Chưa có video nào</p>
          <p className="empty-state-text">Nhấn &quot;Thêm video&quot; để bắt đầu.</p>
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

/**
 * VideoForm Component
 * Create / Edit video form
 */

'use client';

import { useState } from 'react';
import { VIDEO_CATEGORIES } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Chung',
  'ky-thuat': 'Kỹ thuật',
  'the-luc': 'Thể lực',
  'chien-thuat': 'Chiến thuật',
  luat: 'Luật',
};

interface VideoFormData {
  title: string;
  youtube_url: string;
  description: string;
  category: string;
}

interface VideoFormProps {
  initialData?: Partial<VideoFormData>;
  onSubmit: (data: VideoFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

export function VideoForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
}: VideoFormProps) {
  const [form, setForm] = useState<VideoFormData>({
    title: initialData?.title || '',
    youtube_url: initialData?.youtube_url || '',
    description: initialData?.description || '',
    category: initialData?.category || 'general',
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('Tiêu đề là bắt buộc');
      return;
    }
    if (!form.youtube_url.trim()) {
      setError('YouTube URL là bắt buộc');
      return;
    }

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Tiêu đề
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field"
          placeholder="VD: Kỹ thuật cắt cầu cơ bản"
          maxLength={200}
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          YouTube URL
        </label>
        <input
          type="url"
          value={form.youtube_url}
          onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
          className="input-field"
          placeholder="https://youtube.com/watch?v=..."
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Danh mục
        </label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="input-field"
        >
          {VIDEO_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat] || cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Mô tả (tùy chọn)
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field"
          rows={3}
          placeholder="Mô tả ngắn về video..."
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : isEditing ? 'Cập nhật' : 'Thêm video'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

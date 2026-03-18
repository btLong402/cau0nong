/**
 * VideoForm Component
 * Create / Edit video form
 */

'use client';

import { useState } from 'react';
import { VIDEO_CATEGORIES } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Chung',
  'ky-thuat': 'Ky thuat',
  'the-luc': 'The luc',
  'chien-thuat': 'Chien thuat',
  luat: 'Luat',
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
      setError('Tieu de la bat buoc');
      return;
    }
    if (!form.youtube_url.trim()) {
      setError('YouTube URL la bat buoc');
      return;
    }

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Co loi xay ra');
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
          Tieu de
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field"
          placeholder="VD: Ky thuat cut cau co ban"
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
          Danh muc
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
          Mo ta (tuy chon)
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field"
          rows={3}
          placeholder="Mo ta ngan ve video..."
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={loading}
        >
          {loading ? 'Dang xu ly...' : isEditing ? 'Cap nhat' : 'Them video'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          Huy
        </button>
      </div>
    </form>
  );
}

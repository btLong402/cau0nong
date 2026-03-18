/**
 * EventForm Component
 * Create / Edit event form
 */

'use client';

import { useState } from 'react';

interface EventFormData {
  event_name: string;
  event_date: string;
  total_support: number;
  total_expense: number;
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

export function EventForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
}: EventFormProps) {
  const [form, setForm] = useState<EventFormData>({
    event_name: initialData?.event_name || '',
    event_date: initialData?.event_date || '',
    total_support: initialData?.total_support || 0,
    total_expense: initialData?.total_expense || 0,
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.event_name.trim()) {
      setError('Ten su kien la bat buoc');
      return;
    }
    if (!form.event_date) {
      setError('Ngay su kien la bat buoc');
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
          Ten su kien
        </label>
        <input
          type="text"
          value={form.event_name}
          onChange={(e) => setForm({ ...form, event_name: e.target.value })}
          className="input-field"
          placeholder="VD: Giai dau mua xuan 2025"
          maxLength={200}
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Ngay su kien
        </label>
        <input
          type="date"
          value={form.event_date}
          onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          className="input-field"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Tong chi phi (d)
          </label>
          <input
            type="number"
            min={0}
            value={form.total_expense}
            onChange={(e) =>
              setForm({ ...form, total_expense: Number(e.target.value) })
            }
            className="input-field"
            placeholder="500000"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Tai tro / Ho tro (d)
          </label>
          <input
            type="number"
            min={0}
            value={form.total_support}
            onChange={(e) =>
              setForm({ ...form, total_support: Number(e.target.value) })
            }
            className="input-field"
            placeholder="200000"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={loading}
        >
          {loading ? 'Dang xu ly...' : isEditing ? 'Cap nhat' : 'Tao su kien'}
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

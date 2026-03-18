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
      setError('Tên sự kiện là bắt buộc');
      return;
    }
    if (!form.event_date) {
      setError('Ngày sự kiện là bắt buộc');
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
        <div className="rounded-lg bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          Tên sự kiện
        </label>
        <input
          type="text"
          value={form.event_name}
          onChange={(e) => setForm({ ...form, event_name: e.target.value })}
          className="input-field"
          placeholder="VD: Giải đấu mùa xuân 2025"
          maxLength={200}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          Ngày sự kiện
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
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Tổng chi phí (đ)
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
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Tài trợ / Hỗ trợ (đ)
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
          {loading ? 'Đang xử lý...' : isEditing ? 'Cập nhật' : 'Tạo sự kiện'}
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

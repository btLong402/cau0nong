'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCloseMonth, useCreateMonth, useMonths } from '@/shared/hooks';

export default function MonthsPage() {
  const { months, loading, error, refetch } = useMonths();
  const { create, loading: creating } = useCreateMonth();
  const { close, loading: closing } = useCloseMonth();

  const [showNewMonthForm, setShowNewMonthForm] = useState(false);
  const [newMonthDate, setNewMonthDate] = useState('');
  const [closingMonthId, setClosingMonthId] = useState<number | null>(null);
  const [creatingMonth, setCreatingMonth] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openMonths = useMemo(
    () => months.filter((month) => month.status === 'open').length,
    [months],
  );

  async function handleCloseMonth(monthId: number) {
    setActionError(null);
    setClosingMonthId(monthId);

    try {
      await close(monthId);
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể đóng kỳ';
      setActionError(message);
    } finally {
      setClosingMonthId(null);
    }
  }

  async function handleCreateMonth() {
    if (!newMonthDate) return;

    setActionError(null);
    setCreatingMonth(true);

    try {
      await create(newMonthDate, 'open');
      setNewMonthDate('');
      setShowNewMonthForm(false);
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo kỳ quản lý';
      setActionError(message);
    } finally {
      setCreatingMonth(false);
    }
  }

  if (loading) {
    return <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        Không thể tải danh sách kỳ quản lý. Vui lòng thử lại.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Kỳ quản lý</h1>
          <p className="mt-1 text-sm text-slate-600">Quản lý trạng thái tháng, đóng kỳ và khởi tạo quyết toán.</p>
        </div>
        <button
          onClick={() => setShowNewMonthForm(!showNewMonthForm)}
          className="btn-primary"
        >
          {showNewMonthForm ? 'Ẩn form' : 'Tạo kỳ mới'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="surface-card-soft p-5">
          <p className="text-sm text-slate-600">Tổng kỳ đã tạo</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{months.length}</p>
        </article>
        <article className="surface-card-soft p-5">
          <p className="text-sm text-slate-600">Kỳ đang mở</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{openMonths}</p>
        </article>
        <article className="surface-card-soft p-5">
          <p className="text-sm text-slate-600">Kỳ đã đóng</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{months.length - openMonths}</p>
        </article>
      </div>

      {showNewMonthForm && (
        <div className="surface-card-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900">Tạo kỳ quản lý mới</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tháng (định dạng: YYYY-MM-01)
              </label>
              <input
                type="date"
                value={newMonthDate}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  date.setDate(1);
                  setNewMonthDate(date.toISOString().split('T')[0]);
                }}
                className="input-field max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateMonth}
                disabled={creatingMonth || creating}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingMonth || creating ? 'Đang tạo...' : 'Tạo'}
              </button>
              <button
                onClick={() => setShowNewMonthForm(false)}
                className="btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => (
          <article key={month.id} className="surface-card p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {new Date(month.month_year).toLocaleDateString('vi-VN', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                  ID: {month.id}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  month.status === 'open'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {month.status === 'open' ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>

            <div className="mb-5 space-y-2">
              <p className="text-sm text-slate-600">
                Chi phí cầu:
                <span className="ml-2 font-semibold text-slate-900">
                  {month.total_shuttlecock_expense.toLocaleString('vi-VN')} đ
                </span>
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/dashboard/settlements?monthId=${month.id}`}
                className="btn-secondary flex-1 text-sm"
              >
                Quyết toán
              </Link>
              {month.status === 'open' && (
                <button
                  onClick={() => handleCloseMonth(month.id)}
                  disabled={closing && closingMonthId === month.id}
                  className="btn-primary flex-1 bg-amber-600 text-sm hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {closing && closingMonthId === month.id ? 'Đang đóng...' : 'Đóng kỳ'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {months.length === 0 && (
        <div className="surface-card py-12 text-center">
          <p className="mb-4 text-slate-600">Chưa có kỳ quản lý nào</p>
          <button
            onClick={() => setShowNewMonthForm(true)}
            className="btn-primary"
          >
            Tạo kỳ đầu tiên
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCloseMonth, useCreateMonth, useMonths, useAuth } from '@/shared/hooks';

export default function MonthsPage() {
  const { user: authUser } = useAuth();
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
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-4 w-64" />
        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-card p-5 border-l-4 border-l-[var(--danger)]">
        <p className="text-sm text-[var(--danger)]">Không thể tải danh sách kỳ quản lý. Vui lòng thử lại.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kỳ quản lý</h1>
          <p className="page-subtitle">Quản lý trạng thái tháng, đóng kỳ và khởi tạo quyết toán.</p>
        </div>
        {authUser?.role === 'admin' && (
          <button
            onClick={() => setShowNewMonthForm(!showNewMonthForm)}
            className="btn-primary"
          >
            {showNewMonthForm ? 'Ẩn form' : 'Tạo kỳ mới'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="stat-card p-3 sm:p-5">
          <p className="stat-label text-[10px] sm:text-xs">Tổng kỳ</p>
          <p className="stat-value text-xl sm:text-2xl">{months.length}</p>
        </div>
        <div className="stat-card p-3 sm:p-5 border-l-4 border-l-[var(--primary)]">
          <p className="stat-label text-[10px] sm:text-xs">Đang mở</p>
          <p className="stat-value text-xl sm:text-2xl text-[var(--primary)]">{openMonths}</p>
        </div>
        <div className="stat-card p-3 sm:p-5 col-span-2 sm:col-span-1">
          <p className="stat-label text-[10px] sm:text-xs">Kỳ đã đóng</p>
          <p className="stat-value text-xl sm:text-2xl">{months.length - openMonths}</p>
        </div>
      </div>

      {/* New Month Form */}
      {showNewMonthForm && (
        <div className="surface-card-soft p-5">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Tạo kỳ quản lý mới</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
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
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="surface-card p-4 border-l-4 border-l-[var(--danger)]">
          <p className="text-sm text-[var(--danger)]">{actionError}</p>
        </div>
      )}

      {/* Month Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => (
          <article key={month.id} className="surface-card p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  {new Date(month.month_year).toLocaleDateString('vi-VN', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  ID: {month.id}
                </p>
              </div>
              <span className={`badge ${month.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>
                {month.status === 'open' ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-sm text-[var(--muted)]">
                Chi phí cầu:
                <span className="ml-2 font-semibold text-[var(--foreground)]">
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
              {authUser?.role === 'admin' && month.status === 'open' && (
                <button
                  onClick={() => handleCloseMonth(month.id)}
                  disabled={closing && closingMonthId === month.id}
                  className="btn-primary flex-1 bg-[var(--warning)] text-sm hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {closing && closingMonthId === month.id ? 'Đang đóng...' : 'Đóng kỳ'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {months.length === 0 && (
        <div className="surface-card empty-state">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="empty-state-title">Chưa có kỳ quản lý nào</p>
          {authUser?.role === 'admin' && (
            <button onClick={() => setShowNewMonthForm(true)} className="btn-primary mt-4">
              Tạo kỳ đầu tiên
            </button>
          )}
        </div>
      )}
    </div>
  );
}

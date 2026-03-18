'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  profile: {
    id: string;
    name: string;
    phone: string;
    email: string;
    balance: number;
    role: string;
  } | null;
  current_month: {
    month_id: number;
    month_year: string;
    status: string;
    total_sessions: number;
    sessions_attended: number;
  } | null;
  current_settlement: {
    id: number;
    court_fee: number;
    shuttlecock_fee: number;
    past_debt: number;
    balance_carried: number;
    court_payer_offset: number;
    shuttlecock_buyer_offset: number;
    event_debt: number;
    total_due: number;
    is_paid: boolean;
    paid_amount: number | null;
  } | null;
  payment_history: Array<{
    month_year: string;
    court_fee: number;
    shuttlecock_fee: number;
    total_due: number;
    is_paid: boolean;
    paid_amount: number | null;
    paid_at: string | null;
  }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
}

export default function MyAccountPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/me/dashboard', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load dashboard');
        const json = await res.json();
        setData(json.data);
      } catch (err: any) {
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-4 w-56" />
        <div className="skeleton h-32 mt-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="surface-card p-6 text-center border-l-4 border-l-[var(--danger)]">
        <p className="text-[var(--danger)]">{error || 'Không thể tải dữ liệu'}</p>
      </div>
    );
  }

  const { profile, current_month, current_settlement, payment_history } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Trang cá nhân</h1>
        <p className="page-subtitle">Thông tin tài khoản và công nợ của bạn</p>
      </div>

      {/* Profile Card */}
      {profile && (
        <div className="surface-card p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-lg font-bold text-[var(--primary)]">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">{profile.name}</h2>
              <p className="text-sm text-[var(--muted)]">{profile.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[var(--muted)]">Số điện thoại</p>
              <p className="text-sm font-medium text-[var(--foreground)]">{profile.phone}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Email</p>
              <p className="text-sm font-medium text-[var(--foreground)]">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Số dư tài khoản</p>
              <p className={`text-sm font-bold ${profile.balance >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>
                {formatCurrency(profile.balance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Month Summary */}
      {current_month && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="stat-card p-3 sm:p-5 text-center">
            <p className="stat-label text-[10px] sm:text-xs">Tháng hiện tại</p>
            <p className="mt-0.5 text-base sm:text-lg font-bold text-[var(--foreground)]">
              {formatMonth(current_month.month_year)}
            </p>
            <div className="mt-1 flex justify-center">
              <span className={`badge text-[10px] sm:text-xs ${current_month.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>
                {current_month.status === 'open' ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>
          </div>
          <div className="stat-card p-3 sm:p-5 text-center">
            <p className="stat-label text-[10px] sm:text-xs">Buổi tham gia</p>
            <p className="mt-0.5 text-base sm:text-lg font-bold text-[var(--primary)]">
              {current_month.sessions_attended} / {current_month.total_sessions}
            </p>
            <p className="text-[10px] text-[var(--muted)]">buổi</p>
          </div>
          <div className="stat-card p-3 sm:p-5 text-center col-span-2 sm:col-span-1 border-t-2 border-t-[var(--surface-border)] sm:border-t-0">
            <p className="stat-label text-[10px] sm:text-xs">Tiền cần đóng</p>
            <p className={`mt-0.5 text-base sm:text-lg font-bold ${
              current_settlement?.is_paid ? 'text-[var(--accent)]' : 'text-[var(--danger)]'
            }`}>
              {current_settlement
                ? formatCurrency(current_settlement.total_due)
                : '—'}
            </p>
            <div className="mt-1 flex justify-center">
              {current_settlement && (
                <span className={`badge text-[10px] sm:text-xs ${current_settlement.is_paid ? 'badge-success' : 'badge-warning'}`}>
                  {current_settlement.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settlement Breakdown */}
      {current_settlement && (
        <div className="surface-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
            Chi tiết công nợ tháng này
          </h2>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Tiền sân</span>
              <span className="font-medium">{formatCurrency(current_settlement.court_fee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Tiền cầu</span>
              <span className="font-medium">{formatCurrency(current_settlement.shuttlecock_fee)}</span>
            </div>
            {current_settlement.past_debt > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--danger)]">Nợ tồn đọng</span>
                <span className="font-medium text-[var(--danger)]">+{formatCurrency(current_settlement.past_debt)}</span>
              </div>
            )}
            {current_settlement.event_debt > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--warning)]">Tiền sự kiện</span>
                <span className="font-medium text-[var(--warning)]">+{formatCurrency(current_settlement.event_debt)}</span>
              </div>
            )}
            {current_settlement.balance_carried > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--accent)]">Tiền thừa tháng trước</span>
                <span className="font-medium text-[var(--accent)]">-{formatCurrency(current_settlement.balance_carried)}</span>
              </div>
            )}
            {current_settlement.court_payer_offset > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--accent)]">Đã ứng tiền sân</span>
                <span className="font-medium text-[var(--accent)]">-{formatCurrency(current_settlement.court_payer_offset)}</span>
              </div>
            )}
            {current_settlement.shuttlecock_buyer_offset > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--accent)]">Đã ứng tiền cầu</span>
                <span className="font-medium text-[var(--accent)]">-{formatCurrency(current_settlement.shuttlecock_buyer_offset)}</span>
              </div>
            )}
            <div className="border-t border-[var(--surface-border)] pt-2.5 mt-2.5 flex justify-between text-sm font-bold">
              <span className="text-[var(--foreground)]">Tổng cần thanh toán</span>
              <span className={current_settlement.is_paid ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}>
                {formatCurrency(current_settlement.total_due)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payment_history.length > 0 && (
        <div className="surface-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
            Lịch sử thanh toán
          </h2>

          {/* Desktop table */}
          <div className="overflow-x-auto hidden sm:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th className="text-right">Tiền sân</th>
                  <th className="text-right">Tiền cầu</th>
                  <th className="text-right">Tổng</th>
                  <th className="text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {payment_history.map((item) => (
                  <tr key={item.month_year}>
                    <td className="font-medium">{formatMonth(item.month_year)}</td>
                    <td className="text-right text-[var(--muted)]">{formatCurrency(item.court_fee)}</td>
                    <td className="text-right text-[var(--muted)]">{formatCurrency(item.shuttlecock_fee)}</td>
                    <td className="text-right font-semibold">{formatCurrency(item.total_due)}</td>
                    <td className="text-center">
                      <span className={`badge ${item.is_paid ? 'badge-success' : 'badge-warning'}`}>
                        {item.is_paid ? 'Đã đóng' : 'Chưa đóng'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="card-list sm:hidden">
            {payment_history.map((item) => (
              <div key={item.month_year} className="card-list-item">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{formatMonth(item.month_year)}</p>
                  <span className={`badge ${item.is_paid ? 'badge-success' : 'badge-warning'}`}>
                    {item.is_paid ? 'Đã đóng' : 'Chưa đóng'}
                  </span>
                </div>
                <p className="text-lg font-bold text-[var(--foreground)]">{formatCurrency(item.total_due)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!current_month && (
        <div className="surface-card empty-state border-dashed">
          <p className="empty-state-title">Chưa có kỳ quản lý nào được tạo.</p>
        </div>
      )}
    </div>
  );
}

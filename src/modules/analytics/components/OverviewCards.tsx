'use client';

import type { OverviewStats } from '../types';

interface OverviewCardsProps {
  stats: OverviewStats | null;
  loading: boolean;
}

function StatCard({
  label,
  value,
  suffix,
  color,
  loading,
}: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="stat-card p-3 sm:p-5">
      <p className="stat-label text-[10px] sm:text-xs">{label}</p>
      {loading ? (
        <div className="mt-2 skeleton h-8 w-24" />
      ) : (
        <p className={`stat-value truncate text-lg sm:text-2xl ${color}`}>
          {value.toLocaleString('vi-VN')}
          {suffix && <span className="text-xs sm:text-sm font-medium">{suffix}</span>}
        </p>
      )}
    </div>
  );
}

export function OverviewCards({ stats, loading }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Thành viên active"
        value={stats?.active_members || 0}
        color="text-[var(--primary)]"
        loading={loading}
      />
      <StatCard
        label="Tổng buổi tập"
        value={stats?.total_sessions || 0}
        color="text-[var(--accent)]"
        loading={loading}
      />
      <StatCard
        label="Chi phí tháng này"
        value={stats?.total_expense_current_month || 0}
        suffix="đ"
        color="text-[var(--warning)]"
        loading={loading}
      />
      <StatCard
        label="Công nợ chưa đóng"
        value={stats?.unpaid_debt || 0}
        suffix="đ"
        color="text-[var(--danger)]"
        loading={loading}
      />
    </div>
  );
}

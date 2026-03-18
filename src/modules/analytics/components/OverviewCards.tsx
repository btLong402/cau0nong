/**
 * OverviewCards Component
 * 4 stat cards for the analytics dashboard
 */

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
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-slate-200" />
      ) : (
        <p className={`mt-2 text-2xl font-bold ${color}`}>
          {value.toLocaleString('vi-VN')}
          {suffix && <span className="text-sm font-medium">{suffix}</span>}
        </p>
      )}
    </div>
  );
}

export function OverviewCards({ stats, loading }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Thanh vien active"
        value={stats?.active_members || 0}
        color="text-blue-700"
        loading={loading}
      />
      <StatCard
        label="Tong buoi tap"
        value={stats?.total_sessions || 0}
        color="text-green-700"
        loading={loading}
      />
      <StatCard
        label="Chi phi thang nay"
        value={stats?.total_expense_current_month || 0}
        suffix="đ"
        color="text-amber-700"
        loading={loading}
      />
      <StatCard
        label="Cong no chua dong"
        value={stats?.unpaid_debt || 0}
        suffix="đ"
        color="text-red-700"
        loading={loading}
      />
    </div>
  );
}

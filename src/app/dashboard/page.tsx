/**
 * Dashboard Overview Page
 * Analytics dashboard with overview stats, attendance ranking, and expense trend
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OverviewCards } from '@/modules/analytics/components/OverviewCards';
import { AttendanceRankingChart } from '@/modules/analytics/components/AttendanceRankingChart';
import { ExpenseTrendChart } from '@/modules/analytics/components/ExpenseTrendChart';
import type { OverviewStats, AttendanceRankItem, ExpenseTrendItem } from '@/modules/analytics/types';

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRankItem[] | null>(null);
  const [expense, setExpense] = useState<ExpenseTrendItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [overviewRes, attendanceRes, expenseRes] = await Promise.all([
          fetch('/api/analytics?type=overview', { credentials: 'include' }),
          fetch('/api/analytics?type=attendance', { credentials: 'include' }),
          fetch('/api/analytics?type=expense', { credentials: 'include' }),
        ]);

        if (overviewRes.ok) {
          const d = await overviewRes.json();
          setOverview(d.data?.data || null);
        }
        if (attendanceRes.ok) {
          const d = await attendanceRes.json();
          setAttendance(d.data?.data || null);
        }
        if (expenseRes.ok) {
          const d = await expenseRes.json();
          setExpense(d.data?.data || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (error) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="empty-state-title text-[var(--danger)]">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tổng quan hệ thống</h1>
          <p className="page-subtitle">
            Theo dõi nhanh các chỉ số vận hành cơ bản của CLB.
          </p>
        </div>
        <Link href="/dashboard/months" className="btn-secondary">
          Quản lý kỳ
        </Link>
      </div>

      {/* Overview Stats */}
      <OverviewCards stats={overview} loading={loading} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Ranking */}
        <section className="surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Xếp hạng đi đều
          </h2>
          <AttendanceRankingChart data={attendance} loading={loading} />
        </section>

        {/* Expense Trend */}
        <section className="surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Chi phí theo tháng
          </h2>
          <ExpenseTrendChart data={expense} loading={loading} />
        </section>
      </div>
    </div>
  );
}

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
        setError(err instanceof Error ? err.message : 'Loi tai du lieu');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary mt-4"
        >
          Thu lai
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Tong quan he thong
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo doi nhanh cac chi so van hanh co ban cua CLB.
          </p>
        </div>
        <Link href="/dashboard/months" className="btn-secondary">
          Quan ly ky
        </Link>
      </div>

      {/* Overview Stats */}
      <OverviewCards stats={overview} loading={loading} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Ranking */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Xep hang di deu
          </h2>
          <AttendanceRankingChart data={attendance} loading={loading} />
        </section>

        {/* Expense Trend */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Chi phi theo thang
          </h2>
          <ExpenseTrendChart data={expense} loading={loading} />
        </section>
      </div>
    </div>
  );
}

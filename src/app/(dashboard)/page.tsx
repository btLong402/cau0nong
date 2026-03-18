'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Month {
  id: number;
  month_year: string;
  status: string;
}

export default function DashboardPage() {
  const [months, setMonths] = useState<Month[]>([]);
  const [stats, setStats] = useState<{ totalMembers: number; openMonths: number; totalSessions: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/months');

        if (!response.ok) throw new Error('Failed to fetch months');

        const data = await response.json();
        setMonths(data.data?.months || []);

        // Calculate stats
        const openMonths = data.data?.months?.filter((m: Month) => m.status === 'open') || [];
        setStats({
          totalMembers: 0,
          openMonths: openMonths.length,
          totalSessions: 0,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Tong quan he thong</h1>
          <p className="mt-1 text-sm text-slate-600">Theo doi nhanh cac chi so van hanh co ban cua CLB.</p>
        </div>
        <Link href="/dashboard/months" className="btn-secondary">
          Quan ly ky
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="surface-card-soft p-5">
          <p className="text-sm text-slate-600">Thanh vien hoat dong</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats?.totalMembers || 0}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">Cap nhat theo du lieu profile</p>
        </article>

        <article className="surface-card-soft p-5">
          <p className="text-sm text-slate-600">Ky quan ly dang mo</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats?.openMonths || 0}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">Co the tao buoi tap moi</p>
        </article>

        <article className="surface-card-soft p-5">
          <p className="text-sm text-slate-600">Tong buoi tap</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats?.totalSessions || 0}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">Thong ke theo ky hien hanh</p>
        </article>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Ky quan ly gan day</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead className="bg-slate-50 text-left text-sm text-slate-700">
              <tr>
                <th className="px-5 py-3 font-medium">Ky</th>
                <th className="px-5 py-3 font-medium">Trang thai</th>
                <th className="px-5 py-3 font-medium">Hanh dong</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-800">
              {months.slice(0, 6).map((month) => (
                <tr key={month.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    {new Date(month.month_year).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        month.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {month.status === 'open' ? 'Dang mo' : 'Da dong'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href="/dashboard/months" className="font-medium text-blue-700 hover:text-blue-900">
                      Xem chi tiet
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {months.length === 0 && (
          <div className="px-5 py-8 text-sm text-slate-600">Chua co ky quan ly nao. Hay tao ky dau tien.</div>
        )}
      </section>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

interface Month {
  id: number;
  month_year: string;
  status: string;
}

interface Session {
  id: number;
  session_date: string;
  court_expense_amount: number;
  payer_user_id: string;
  notes?: string;
}

export default function SessionsPage() {
  const [months, setMonths] = useState<Month[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);

  useEffect(() => {
    async function fetchMonths() {
      try {
        const response = await fetch('/api/months');

        if (!response.ok) {
          throw new Error('Failed to fetch months');
        }

        const data = await response.json();
        const monthsList = data.data?.months || [];
        setMonths(monthsList);

        const openMonth = monthsList.find((m: Month) => m.status === 'open');
        if (openMonth) {
          setSelectedMonth(openMonth.id);
        } else if (monthsList.length > 0) {
          setSelectedMonth(monthsList[0].id);
        }
      } catch (error) {
        console.error('Error fetching months:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMonths();
  }, []);

  useEffect(() => {
    if (!selectedMonth) {
      return;
    }

    async function fetchSessions() {
      try {
        const response = await fetch(`/api/months/${selectedMonth}/sessions`);

        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const data = await response.json();
        setSessions(data.data?.sessions || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    }

    fetchSessions();
  }, [selectedMonth]);

  if (loading) {
    return <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Buoi tap</h1>
          <p className="mt-1 text-sm text-slate-600">Quan ly danh sach buoi tap va thong tin diem danh.</p>
        </div>
        {selectedMonth && (
          <button
            onClick={() => setShowNewSessionForm((prev) => !prev)}
            className="btn-primary"
          >
            Them buoi tap
          </button>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Chon ky quan ly</label>
        <select
          value={selectedMonth || ''}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
          className="input-field max-w-md"
        >
          {months.map((month) => (
            <option key={month.id} value={month.id}>
              {new Date(month.month_year).toLocaleDateString('vi-VN', {
                month: 'long',
                year: 'numeric',
              })} ({month.status === 'open' ? 'Dang mo' : 'Da dong'})
            </option>
          ))}
        </select>
      </div>

      {showNewSessionForm && (
        <div className="surface-card-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900">Tao buoi tap moi</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Ngay</label>
              <input type="date" className="input-field" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Chi phi san (d)</label>
              <input type="number" placeholder="200000" className="input-field" />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1">Tao</button>
              <button
                onClick={() => setShowNewSessionForm(false)}
                className="btn-secondary flex-1"
              >
                Huy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left font-medium text-gray-700">Ngay</th>
              <th className="px-6 py-4 text-left font-medium text-gray-700">Chi phi san</th>
              <th className="px-6 py-4 text-left font-medium text-gray-700">Nguoi tra</th>
              <th className="px-6 py-4 text-left font-medium text-gray-700">Ghi chu</th>
              <th className="px-6 py-4 text-left font-medium text-gray-700">Hanh dong</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  {new Date(session.session_date).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {session.court_expense_amount.toLocaleString('vi-VN')} d
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{session.payer_user_id.substring(0, 8)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{session.notes || '-'}</td>
                <td className="px-6 py-4">
                  <a
                    href={`/dashboard/sessions/${session.id}`}
                    className="text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    Diem danh
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sessions.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-600">Chua co buoi tap nao trong ky nay</p>
          </div>
        )}
      </div>
    </div>
  );
}

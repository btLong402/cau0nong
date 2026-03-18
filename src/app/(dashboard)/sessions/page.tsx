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
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/months', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch months');

        const data = await response.json();
        const monthsList = data.data?.months || [];
        setMonths(monthsList);
        
        // Set first open month as selected
        const openMonth = monthsList.find((m: any) => m.status === 'open');
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
    if (!selectedMonth) return;

    async function fetchSessions() {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/months/${selectedMonth}/sessions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch sessions');

        const data = await response.json();
        setSessions(data.data?.sessions || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    }

    fetchSessions();
  }, [selectedMonth]);

  if (loading) {
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Buổi Tập</h1>
        {selectedMonth && (
          <button
            onClick={() => setShowNewSessionForm(!showNewSessionForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Thêm buổi tập
          </button>
        )}
      </div>

      {/* Month Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn kỳ quản lý</label>
        <select
          value={selectedMonth || ''}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {months.map((month) => (
            <option key={month.id} value={month.id}>
              {new Date(month.month_year).toLocaleDateString('vi-VN', {
                month: 'long',
                year: 'numeric',
              })} ({month.status === 'open' ? 'Đang mở' : 'Đã đóng'})
            </option>
          ))}
        </select>
      </div>

      {showNewSessionForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tạo Buổi Tập Mới</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chi phí sân (đ)</label>
              <input
                type="number"
                placeholder="200000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Tạo
              </button>
              <button
                onClick={() => setShowNewSessionForm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Ngày</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Chi phí sân</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Người trả</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Ghi chú</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="py-4 px-6">
                  {new Date(session.session_date).toLocaleDateString('vi-VN')}
                </td>
                <td className="py-4 px-6 font-medium">
                  {session.court_expense_amount.toLocaleString('vi-VN')} đ
                </td>
                <td className="py-4 px-6 text-sm text-gray-600">{session.payer_user_id.substring(0, 8)}</td>
                <td className="py-4 px-6 text-sm text-gray-600">{session.notes || '-'}</td>
                <td className="py-4 px-6">
                  <a
                    href={`/dashboard/sessions/${session.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Điểm danh →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Chưa có buổi tập nào trong kỳ này</p>
          </div>
        )}
      </div>
    </div>
  );
}

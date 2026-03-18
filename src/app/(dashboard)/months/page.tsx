'use client';

import { useEffect, useState } from 'react';

interface Month {
  id: number;
  month_year: string;
  status: string;
  total_shuttlecock_expense: number;
}

export default function MonthsPage() {
  const [months, setMonths] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMonthForm, setShowNewMonthForm] = useState(false);
  const [newMonthDate, setNewMonthDate] = useState('');

  useEffect(() => {
    fetchMonths();
  }, []);

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
      setMonths(data.data?.months || []);
    } catch (error) {
      console.error('Error fetching months:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMonth() {
    if (!newMonthDate) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/months', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          month_year: newMonthDate,
          status: 'open',
        }),
      });

      if (!response.ok) throw new Error('Failed to create month');

      setNewMonthDate('');
      setShowNewMonthForm(false);
      await fetchMonths();
    } catch (error) {
      console.error('Error creating month:', error);
    }
  }

  if (loading) {
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kỳ Quản Lý</h1>
        <button
          onClick={() => setShowNewMonthForm(!showNewMonthForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Tạo kỳ mới
        </button>
      </div>

      {showNewMonthForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tạo Kỳ Quản Lý Mới</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateMonth}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Tạo
              </button>
              <button
                onClick={() => setShowNewMonthForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map((month) => (
          <div key={month.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {new Date(month.month_year).toLocaleDateString('vi-VN', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  month.status === 'open'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {month.status === 'open' ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                Chi phí cầu:
                <span className="font-medium text-gray-900 ml-2">
                  {month.total_shuttlecock_expense.toLocaleString('vi-VN')} đ
                </span>
              </p>
            </div>

            <div className="flex gap-2">
              <a
                href={`/dashboard/months/${month.id}`}
                className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Chi tiết
              </a>
              {month.status === 'open' && (
                <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm">
                  Đóng kỳ
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {months.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">Chưa có kỳ quản lý nào</p>
          <button
            onClick={() => setShowNewMonthForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Tạo kỳ đầu tiên
          </button>
        </div>
      )}
    </div>
  );
}

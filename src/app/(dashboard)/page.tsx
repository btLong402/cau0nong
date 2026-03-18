'use client';

import { useEffect, useState } from 'react';

interface Month {
  id: number;
  month_year: string;
  status: string;
}

export default function DashboardPage() {
  const [months, setMonths] = useState<Month[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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

        // Calculate stats
        const openMonths = data.data?.months?.filter((m: any) => m.status === 'open') || [];
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
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Thành viên hoạt động</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalMembers || 0}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Kỳ quản lý mở</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.openMonths || 0}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Buổi tập</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalSessions || 0}</p>
            </div>
            <div className="text-4xl">🎾</div>
          </div>
        </div>
      </div>

      {/* Recent Months */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Kỳ quản lý gần đây</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Kỳ</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {months.slice(0, 5).map((month) => (
                <tr key={month.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{new Date(month.month_year).toLocaleDateString('vi-VN')}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        month.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {month.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <a href={`/dashboard/months/${month.id}`} className="text-blue-600 hover:text-blue-700">
                      Chi tiết →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

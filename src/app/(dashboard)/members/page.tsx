'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  balance: number;
  is_active: boolean;
}

export default function MembersPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/users?page=${page}&limit=20`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch members');

        const data = await response.json();
        setMembers(data.data?.members || []);
        
        // Calculate total pages
        const total = data.data?.total || 0;
        setTotalPages(Math.ceil(total / 20));
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [page]);

  if (loading) {
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Thành viên</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          + Thêm thành viên
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Họ tên</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Email</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Điện thoại</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Vai trò</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Số dư</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Trạng thái</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="py-4 px-6">{member.name}</td>
                <td className="py-4 px-6 text-sm text-gray-600">{member.email}</td>
                <td className="py-4 px-6 text-sm">{member.phone}</td>
                <td className="py-4 px-6">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {member.role === 'admin' ? 'Quản trị' : 'Thành viên'}
                  </span>
                </td>
                <td className="py-4 px-6 font-medium">
                  <span className={member.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {member.balance.toLocaleString('vi-VN')} đ
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {member.is_active ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <a href={`/dashboard/members/${member.id}`} className="text-blue-600 hover:text-blue-700 text-sm">
                    Chi tiết →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Chưa có thành viên nào</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          ← Trước
        </button>
        <span className="px-4 py-2">Trang {page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}

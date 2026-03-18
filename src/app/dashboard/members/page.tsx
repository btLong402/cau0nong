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
        const response = await fetch(`/api/users?page=${page}&limit=20`);

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
    return <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Quan ly thanh vien</h1>
          <p className="mt-1 text-sm text-slate-600">Danh sach thanh vien va trang thai tai khoan theo thoi gian thuc.</p>
        </div>
        <button className="btn-primary">Them thanh vien</button>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-left text-sm text-slate-700">
                <th className="px-6 py-4 font-medium text-gray-700">Họ tên</th>
                <th className="px-6 py-4 font-medium text-gray-700">Email</th>
                <th className="px-6 py-4 font-medium text-gray-700">Điện thoại</th>
                <th className="px-6 py-4 font-medium text-gray-700">Vai trò</th>
                <th className="px-6 py-4 font-medium text-gray-700">Số dư</th>
                <th className="px-6 py-4 font-medium text-gray-700">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{member.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{member.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{member.phone}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {member.role === 'admin' ? 'Quan tri' : 'Thanh vien'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <span className={member.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {member.balance.toLocaleString('vi-VN')} đ
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        member.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {member.is_active ? 'Hoat dong' : 'Khong hoat dong'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <a href={`/dashboard/members/${member.id}`} className="text-sm font-medium text-blue-700 hover:text-blue-900">
                      Chi tiet
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {members.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-600">Chua co thanh vien nao</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Truoc
        </button>
        <span className="px-4 py-2 text-sm text-slate-600">Trang {page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

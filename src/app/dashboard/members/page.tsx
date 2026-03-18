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
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-72" />
        <div className="space-y-3 mt-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý thành viên</h1>
          <p className="page-subtitle">Danh sách thành viên và trạng thái tài khoản.</p>
        </div>
        <button className="btn-primary">Thêm thành viên</button>
      </div>

      {/* Desktop Table */}
      <div className="surface-card overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Vai trò</th>
                <th>Số dư</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="font-medium">{member.name}</td>
                  <td className="text-[var(--muted)]">{member.email}</td>
                  <td>{member.phone}</td>
                  <td>
                    <span className={`badge ${member.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
                      {member.role === 'admin' ? 'Quản trị' : 'Thành viên'}
                    </span>
                  </td>
                  <td className="font-medium">
                    <span className={member.balance >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}>
                      {member.balance.toLocaleString('vi-VN')} đ
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${member.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {member.is_active ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  <td>
                    <a href={`/dashboard/members/${member.id}`} className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer">
                      Chi tiết
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="card-list lg:hidden">
        {members.map((member) => (
          <a key={member.id} href={`/dashboard/members/${member.id}`} className="card-list-item cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{member.name}</p>
                  <span className={`badge text-[10px] ${member.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
                    {member.role === 'admin' ? 'Admin' : 'TV'}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">{member.phone}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${member.balance >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>
                  {member.balance.toLocaleString('vi-VN')} đ
                </p>
                <span className={`badge text-[10px] ${member.is_active ? 'badge-success' : 'badge-neutral'}`}>
                  {member.is_active ? 'Hoạt động' : 'Ngừng'}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {members.length === 0 && (
        <div className="surface-card empty-state">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <p className="empty-state-title">Chưa có thành viên nào</p>
          <p className="empty-state-text">Thêm thành viên đầu tiên để bắt đầu.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-sm text-[var(--muted)]">Trang {page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

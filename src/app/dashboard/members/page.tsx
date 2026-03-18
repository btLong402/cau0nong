'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks';

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
  const { user: authUser } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Add Member Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'member'
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
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
  };

  useEffect(() => {
    fetchMembers();
  }, [page]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const result = await response.json();
        let errorMessage = 'Failed to create member';
        if (result.error) {
          if (typeof result.error === 'string') {
            errorMessage = result.error;
          } else if (result.error.message) {
            errorMessage = result.error.message;
          } else {
            errorMessage = JSON.stringify(result.error);
          }
        }
        throw new Error(errorMessage);
      }

      // Success
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'member' });
      fetchMembers(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && members.length === 0) {
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
        {authUser?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            Thêm thành viên
          </button>
        )}
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

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="surface-card max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold">Thêm thành viên mới</h2>
            
            {error && (
              <div className="p-3 bg-[var(--danger-soft)] text-[var(--danger)] text-sm rounded-md border border-[var(--danger)]">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-4 mt-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">Họ tên</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">Email</label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09xxx..."
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">Mật khẩu (mặc định: 123456)</label>
                <input
                  type="password"
                  className="input-field"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Để trống nếu dùng mặc định"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)] uppercase">Vai trò</label>
                <select 
                  className="input-field"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="member">Thành viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo thành viên'}
                </button>
              </div>
            </form>
          </div>
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

'use client';

import { FormEvent, use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/shared/hooks';

interface MemberDetail {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'member';
  balance: number;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface MemberUpdateForm {
  name: string;
  email: string;
  phone: string;
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: memberId } = use(params);
  const { user: authUser } = useAuth();

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<MemberUpdateForm>({
    name: '',
    email: '',
    phone: '',
  });

  const isAdmin = authUser?.role === 'admin';

  const statusTone = useMemo(() => {
    if (!member) return 'badge-neutral';
    return member.is_active ? 'badge-success' : 'badge-neutral';
  }, [member]);

  const approvalTone = useMemo(() => {
    if (!member) return 'badge-neutral';
    if (member.approval_status === 'approved') return 'badge-success';
    if (member.approval_status === 'rejected') return 'badge-neutral';
    return 'badge-warning';
  }, [member]);

  const approvalLabel = useMemo(() => {
    if (!member) return 'Không xác định';
    if (member.approval_status === 'approved') return 'Đã duyệt';
    if (member.approval_status === 'rejected') return 'Từ chối';
    return 'Chờ duyệt';
  }, [member]);

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('vi-VN');
  };

  const loadMember = async () => {
    setLoading(true);
    setFetchError(null);
    setNotFound(false);

    try {
      const response = await fetch(`/api/users/${memberId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const result = await response.json();

      if (!response.ok) {
        const message = result?.error?.message || 'Không thể tải thông tin thành viên';

        if (response.status === 404) {
          setNotFound(true);
          return;
        }

        throw new Error(message);
      }

      const payload = result?.data?.user as MemberDetail | undefined;
      if (!payload) {
        throw new Error('Dữ liệu thành viên không hợp lệ');
      }

      setMember(payload);
      setFormData({
        name: payload.name || '',
        email: payload.email || '',
        phone: payload.phone || '',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể tải thông tin thành viên';
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!member) return;

    setIsSaving(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(`/api/users/${member.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error?.message || 'Cập nhật thành viên thất bại');
      }

      const updated = result?.data?.user as MemberDetail | undefined;
      if (!updated) {
        throw new Error('Không nhận được dữ liệu cập nhật hợp lệ');
      }

      setMember(updated);
      setIsEditing(false);
      setActionSuccess('Đã lưu thông tin thành viên thành công.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể cập nhật thông tin thành viên';
      setActionError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (!member) return;

    setIsProcessingApproval(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(`/api/users/${member.id}/approval`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result?.error?.message ||
            (action === 'approve' ? 'Duyệt thành viên thất bại' : 'Từ chối thành viên thất bại'),
        );
      }

      const updated = result?.data?.user as MemberDetail | undefined;
      if (!updated) {
        throw new Error('Không nhận được dữ liệu sau khi xử lý duyệt');
      }

      setMember(updated);
      setActionSuccess(
        action === 'approve'
          ? 'Tài khoản đã được duyệt và có thể đăng nhập.'
          : 'Tài khoản đã bị từ chối.',
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể xử lý trạng thái duyệt';
      setActionError(message);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <div className="skeleton h-9 w-52" />
        <div className="skeleton h-28 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="skeleton h-64 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="empty-state">
        <svg
          className="empty-state-icon text-[var(--danger)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <p className="empty-state-title">Không tìm thấy thành viên</p>
        <p className="empty-state-text">Thành viên có thể đã bị xóa hoặc đường dẫn không còn hợp lệ.</p>
        <Link href="/dashboard/members" className="btn-primary mt-4">
          Quay lại danh sách thành viên
        </Link>
      </div>
    );
  }

  if (fetchError || !member) {
    return (
      <div className="surface-card p-5 max-w-2xl border-l-4 border-l-[var(--danger)]">
        <p className="text-sm text-[var(--danger)]">
          {fetchError || 'Không thể tải chi tiết thành viên. Vui lòng thử lại.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={loadMember} className="btn-secondary">
            Tải lại
          </button>
          <Link href="/dashboard/members" className="btn-primary">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mobile-bottom-pad">
      <div className="page-header">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/members"
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--surface-border)] hover:bg-[var(--surface-hover)]"
            aria-label="Quay lại danh sách thành viên"
          >
            <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="page-title">Chi tiết thành viên</h1>
            <p className="page-subtitle">Theo dõi trạng thái tài khoản, công nợ và thông tin liên hệ.</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsEditing((prev) => !prev);
                setActionError(null);
                setActionSuccess(null);
              }}
            >
              {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
            </button>
          </div>
        )}
      </div>

      <section className="surface-card-soft p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-2xl font-bold text-white">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">{member.name}</h2>
              <p className="text-sm text-[var(--muted)]">@{member.username} • {member.email}</p>
              <p className="text-sm text-[var(--muted)]">{member.phone}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${member.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
              {member.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
            </span>
            <span className={`badge ${statusTone}`}>{member.is_active ? 'Hoạt động' : 'Ngưng hoạt động'}</span>
            <span className={`badge ${approvalTone}`}>{approvalLabel}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="stat-card">
          <p className="stat-label">Số dư hiện tại</p>
          <p className={`stat-value ${member.balance >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>
            {member.balance.toLocaleString('vi-VN')} đ
          </p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Ngày tạo tài khoản</p>
          <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{formatDateTime(member.created_at)}</p>
        </article>
        <article className="stat-card sm:col-span-2 lg:col-span-1">
          <p className="stat-label">Cập nhật gần nhất</p>
          <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{formatDateTime(member.updated_at)}</p>
        </article>
      </section>

      {actionError && (
        <div className="surface-card border-l-4 border-l-[var(--danger)] p-4">
          <p className="text-sm text-[var(--danger)]">{actionError}</p>
        </div>
      )}

      {actionSuccess && (
        <div className="surface-card border-l-4 border-l-[var(--accent)] p-4">
          <p className="text-sm text-[var(--accent)]">{actionSuccess}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="surface-card p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-4">Thông tin liên hệ</h3>

          {isEditing && isAdmin ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label htmlFor="member-name" className="mb-1 block text-xs font-medium uppercase text-[var(--muted)]">
                  Họ tên
                </label>
                <input
                  id="member-name"
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Nhập họ tên"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="member-email" className="mb-1 block text-xs font-medium uppercase text-[var(--muted)]">
                    Email
                  </label>
                  <input
                    id="member-email"
                    type="email"
                    required
                    className="input-field"
                    value={formData.email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="member-phone" className="mb-1 block text-xs font-medium uppercase text-[var(--muted)]">
                    Điện thoại
                  </label>
                  <input
                    id="member-phone"
                    type="tel"
                    required
                    className="input-field"
                    value={formData.phone}
                    onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="09xxxxxxxx"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: member.name,
                      email: member.email,
                      phone: member.phone,
                    });
                  }}
                  disabled={isSaving}
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <dl className="space-y-3">
              <div className="flex flex-col rounded-lg border border-[var(--surface-border)] p-3 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-xs font-medium uppercase text-[var(--muted)]">Họ tên</dt>
                <dd className="text-sm font-semibold text-[var(--foreground)]">{member.name}</dd>
              </div>
              <div className="flex flex-col rounded-lg border border-[var(--surface-border)] p-3 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-xs font-medium uppercase text-[var(--muted)]">Email</dt>
                <dd className="text-sm font-semibold text-[var(--foreground)]">{member.email}</dd>
              </div>
              <div className="flex flex-col rounded-lg border border-[var(--surface-border)] p-3 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-xs font-medium uppercase text-[var(--muted)]">Điện thoại</dt>
                <dd className="text-sm font-semibold text-[var(--foreground)]">{member.phone}</dd>
              </div>
              <div className="flex flex-col rounded-lg border border-[var(--surface-border)] p-3 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-xs font-medium uppercase text-[var(--muted)]">Mã thành viên</dt>
                <dd className="text-xs font-mono text-[var(--muted)]">{member.id}</dd>
              </div>
            </dl>
          )}
        </section>

        <aside className="surface-card-teal p-5">
          <h3 className="text-base font-semibold text-[var(--foreground)]">Hành động nhanh</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Các tác vụ quản trị cho trạng thái tài khoản thành viên.</p>

          {isAdmin ? (
            <div className="mt-4 space-y-3">
              <button
                type="button"
                className="btn-primary w-full"
                onClick={loadMember}
                disabled={loading}
              >
                Tải mới dữ liệu
              </button>

              {member.approval_status === 'pending' && (
                <>
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={() => handleApprovalAction('approve')}
                    disabled={isProcessingApproval}
                  >
                    {isProcessingApproval ? 'Đang xử lý...' : 'Duyệt tài khoản'}
                  </button>
                  <button
                    type="button"
                    className="btn-danger w-full"
                    onClick={() => handleApprovalAction('reject')}
                    disabled={isProcessingApproval}
                  >
                    {isProcessingApproval ? 'Đang xử lý...' : 'Từ chối tài khoản'}
                  </button>
                </>
              )}

              {member.approval_status !== 'pending' && (
                <div className="rounded-lg border border-[var(--surface-border)] bg-white/70 p-3 text-sm text-[var(--muted)]">
                  Tài khoản đã ở trạng thái {approvalLabel.toLowerCase()}.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-[var(--surface-border)] bg-white/70 p-3 text-sm text-[var(--muted)]">
              Bạn chỉ có quyền xem thông tin. Hãy liên hệ quản trị viên để cập nhật dữ liệu thành viên.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

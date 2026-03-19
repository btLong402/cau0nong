'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

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

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: memberId } = use(params);

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary" onClick={loadMember}>
            Tải mới dữ liệu
          </button>
        </div>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="surface-card p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-4">Thông tin liên hệ</h3>

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
        </section>

        <aside className="surface-card-teal p-5">
          <h3 className="text-base font-semibold text-[var(--foreground)]">Lưu ý</h3>
          <div className="mt-4 space-y-3 rounded-lg border border-[var(--surface-border)] bg-white/70 p-3 text-sm text-[var(--muted)]">
            <p>Trang này chỉ dùng để xem thông tin thành viên.</p>
            <p>Thành viên tự cập nhật thông tin cá nhân tại trang tài khoản của chính mình.</p>
          </div>
          <Link href="/dashboard/my-account" className="btn-primary mt-4 w-full">
            Đến trang tài khoản cá nhân
          </Link>
        </aside>
      </div>
    </div>
  );
}

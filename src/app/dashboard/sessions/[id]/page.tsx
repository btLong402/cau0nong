'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useAuth,
  useMembers,
  useMonths,
  useRecordAttendance,
  useSession,
  useSessionAttendance,
} from '@/shared/hooks';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: sessionId } = use(params);
  const sessionIdNumber = Number(sessionId);
  const { user: authUser } = useAuth();
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
  } = useSession(0, Number.isNaN(sessionIdNumber) ? 0 : sessionIdNumber);
  const { months, loading: monthsLoading, error: monthsError } = useMonths();
  const monthStatus = months.find((month) => month.id === session?.month_id)?.status || 'open';
  const {
    members: users,
    loading: usersLoading,
    error: usersError,
  } = useMembers(1, 200, {
    enabled: authUser?.role === 'admin',
  });
  const {
    attendance: attendanceList,
    loading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useSessionAttendance(
    session?.month_id || 0,
    Number.isNaN(sessionIdNumber) ? 0 : sessionIdNumber,
  );
  const { record } = useRecordAttendance();

  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!attendanceList.length) {
      return;
    }

    const attendanceMap: Record<string, boolean> = {};
    attendanceList.forEach((item) => {
      attendanceMap[item.user_id] = item.is_attended;
    });
    setAttendance(attendanceMap);
  }, [attendanceList]);

  const toggleAttendance = (userId: string) => {
    if (monthStatus === 'closed' || session?.status === 'closed') return;
    setAttendance((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleSave = async () => {
    if (!session) return;
    
    setSaving(true);
    setError('');
    setSuccess(false);

    const records = Object.entries(attendance).map(([user_id, is_attended]) => ({
      user_id,
      is_attended,
    }));

    try {
      await record(session.month_id, session.id, records);
      await refetchAttendance();

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/sessions');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const loading =
    sessionLoading ||
    monthsLoading ||
    attendanceLoading ||
    (authUser?.role === 'admin' && usersLoading);

  const dataError =
    sessionError ||
    monthsError ||
    attendanceError ||
    (authUser?.role === 'admin' ? usersError : null);

  useEffect(() => {
    if (dataError) {
      setError(dataError.message || 'Không thể tải dữ liệu điểm danh. Vui lòng thử lại sau.');
    }
  }, [dataError]);

  const attendedCount = Object.values(attendance).filter(Boolean).length;

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-4 w-48" />
        <div className="space-y-2 mt-6">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-14" />)}
        </div>
      </div>
    );
  }

  if (!session && !loading) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="empty-state-title">Không tìm thấy thông tin buổi tập</p>
        <Link href="/dashboard/sessions" className="btn-primary mt-4">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const isEditable = authUser?.role === 'admin' && monthStatus === 'open' && session?.status === 'open';

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/sessions" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--surface-border)] hover:bg-[var(--surface-hover)] cursor-pointer">
          <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Điểm danh</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-[var(--muted)]">
              Ngày {new Date(session!.session_date).toLocaleDateString('vi-VN')} • 
              Chi phí: {session!.court_expense_amount.toLocaleString('vi-VN')} đ
            </p>
            {monthStatus === 'closed' && (
              <span className="badge badge-neutral">Đã đóng kỳ</span>
            )}
            {session?.status === 'closed' && monthStatus !== 'closed' && (
              <span className="badge badge-warning">Đã đóng buổi</span>
            )}
          </div>
        </div>
      </div>

      {/* Attendance card */}
      <div className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Danh sách thành viên</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-[var(--primary)]">{attendedCount}</span>
            <span className="text-sm text-[var(--muted)]">/ {users.length} người</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 surface-card p-3 border-l-4 border-l-[var(--danger)]">
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 surface-card p-3 border-l-4 border-l-[var(--accent)]">
            <p className="text-sm text-[var(--accent)]">Lưu điểm danh thành công! Đang chuyển hướng...</p>
          </div>
        )}

        {/* User list */}
        <div className="divide-y divide-[var(--surface-border)] overflow-hidden rounded-lg border border-[var(--surface-border)]">
          {users.map((user) => (
            <div 
              key={user.id} 
              onClick={() => toggleAttendance(user.id)}
              className={`flex items-center justify-between p-3.5 transition-colors ${isEditable ? 'cursor-pointer hover:bg-[var(--surface-hover)]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  attendance[user.id] ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'bg-[var(--surface-hover)] text-[var(--muted)]'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{user.name}</p>
                  <p className="text-xs text-[var(--muted)]">{user.email}</p>
                </div>
              </div>
              <div className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                attendance[user.id] 
                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                  : 'bg-white border-[var(--surface-border-strong)]'
              }`}>
                {attendance[user.id] && (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          {isEditable ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 py-3"
            >
              {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
            </button>
          ) : (
            <div className="flex-1 rounded-lg bg-[var(--surface-hover)] p-3 text-center text-sm font-medium text-[var(--muted)]">
              {authUser?.role !== 'admin' 
                ? 'Chỉ xem (Không có quyền chỉnh sửa)' 
                : session?.status === 'closed' 
                  ? 'Buổi tập đã đóng — Không thể chỉnh sửa' 
                  : 'Kỳ quản lý đã đóng — Không thể chỉnh sửa'}
            </div>
          )}
          <Link href="/dashboard/sessions" className="btn-secondary flex-1 py-3 text-center">
            {isEditable ? 'Hủy' : 'Quay lại'}
          </Link>
        </div>
      </div>
    </div>
  );
}

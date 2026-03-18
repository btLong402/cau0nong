'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CustomSelect } from '@/shared/components/CustomSelect';
import { useAuth } from '@/shared/hooks';

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
  status: 'open' | 'closed';
}

export default function SessionsPage() {
  const { user: authUser } = useAuth();
  const [months, setMonths] = useState<Month[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [sessionDate, setSessionDate] = useState('');
  const [courtExpense, setCourtExpense] = useState('');
  const [payerUserId, setPayerUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function fetchMonths() {
      try {
        const response = await fetch('/api/months');

        if (!response.ok) {
          throw new Error('Failed to fetch months');
        }

        const data = await response.json();
        const monthsList = data.data?.months || [];
        setMonths(monthsList);

        const openMonth = monthsList.find((m: Month) => m.status === 'open');
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

    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.data?.members || []);
          if (data.data?.members?.length > 0) {
            setPayerUserId(data.data.members[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }

    fetchMonths();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!selectedMonth) {
      return;
    }

    async function fetchSessions() {
      try {
        const response = await fetch(`/api/months/${selectedMonth}/sessions`);

        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const data = await response.json();
        setSessions(data.data?.sessions || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    }

    fetchSessions();

    const today = new Date().toISOString().split('T')[0];
    setSessionDate(today);
  }, [selectedMonth]);

  async function handleCreateSession() {
    if (!selectedMonth || !sessionDate || !courtExpense || !payerUserId) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    setCreating(true);
    setFormError('');

    try {
      const response = await fetch(`/api/months/${selectedMonth}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_date: sessionDate,
          court_expense_amount: parseInt(courtExpense, 10),
          payer_user_id: payerUserId,
          notes: notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Không thể tạo buổi tập');
      }

      const data = await response.json();
      setSessions((prev) => [data.data.session, ...prev]);
      setShowNewSessionForm(false);
      
      setCourtExpense('');
      setNotes('');
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-4 w-64" />
        <div className="space-y-3 mt-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Buổi tập</h1>
          <p className="page-subtitle">Quản lý danh sách buổi tập và thông tin điểm danh.</p>
        </div>
        {authUser?.role === 'admin' && selectedMonth && months.find(m => m.id === selectedMonth)?.status === 'open' && (
          <button
            onClick={() => setShowNewSessionForm((prev) => !prev)}
            className="btn-primary"
          >
            Thêm buổi tập
          </button>
        )}
      </div>

      {/* Month selector */}
      <CustomSelect
        label="Chọn kỳ quản lý"
        value={selectedMonth}
        onChange={(val) => setSelectedMonth(val)}
        options={months.map((m) => ({
          value: m.id,
          label: new Date(m.month_year).toLocaleDateString('vi-VN', {
            month: 'long',
            year: 'numeric',
          }),
          sublabel: m.status === 'open' ? 'Đang mở' : 'Đã đóng',
        }))}
        className="max-w-md"
      />

      {/* New session form */}
      {showNewSessionForm && (
        <div className="surface-card-soft p-5">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Tạo buổi tập mới</h2>
          {formError && (
            <div className="mt-3 surface-card p-3 border-l-4 border-l-[var(--danger)]">
              <p className="text-sm text-[var(--danger)]">{formError}</p>
            </div>
          )}
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Ngày *</label>
                <input 
                  type="date" 
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="input-field" 
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Chi phí sân (đ) *</label>
                <input 
                  type="number" 
                  placeholder="200000" 
                  value={courtExpense}
                  onChange={(e) => setCourtExpense(e.target.value)}
                  className="input-field" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomSelect
                label="Người ứng tiền *"
                value={payerUserId}
                onChange={(val) => setPayerUserId(val)}
                options={users.map(user => ({
                  value: user.id,
                  label: user.name
                }))}
                placeholder="Chọn thành viên"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Ghi chú</label>
                <input 
                  type="text" 
                  placeholder="Ứng tiền sân..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field" 
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button 
                onClick={handleCreateSession}
                disabled={creating}
                className="btn-primary flex-1"
              >
                {creating ? 'Đang tạo...' : 'Tạo'}
              </button>
              <button
                onClick={() => setShowNewSessionForm(false)}
                className="btn-secondary flex-1"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="surface-card overflow-hidden hidden lg:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Chi phí sân</th>
              <th>Người trả</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="font-medium">
                  {new Date(session.session_date).toLocaleDateString('vi-VN')}
                </td>
                <td className="font-semibold text-[var(--foreground)]">
                  {session.court_expense_amount.toLocaleString('vi-VN')} đ
                </td>
                <td className="text-[var(--muted)]">
                  {users.find(u => u.id === session.payer_user_id)?.name || session.payer_user_id.substring(0, 8)}
                </td>
                <td className="text-[var(--muted)]">{session.notes || '—'}</td>
                <td>
                  <span className={`badge ${session.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>
                    {session.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/sessions/${session.id}`}
                      className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer"
                    >
                      {session.status === 'closed' || months.find(m => m.id === selectedMonth)?.status === 'closed' 
                        ? 'Xem điểm danh' 
                        : 'Điểm danh'}
                    </Link>
                    {authUser?.role === 'admin' && session.status === 'open' && months.find(m => m.id === selectedMonth)?.status === 'open' && (
                      <button
                        onClick={async () => {
                          if (!confirm('Bạn có chắc muốn đóng buổi tập này? Sau khi đóng sẽ không thể sửa điểm danh.')) return;
                          try {
                            const res = await fetch(`/api/months/${selectedMonth}/sessions/${session.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'closed' }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setSessions(prev => prev.map(s => s.id === session.id ? data.data.session : s));
                            }
                          } catch (err) {
                            console.error('Error closing session:', err);
                          }
                        }}
                        className="text-sm font-medium text-[var(--warning)] hover:text-amber-800 cursor-pointer"
                      >
                        Đóng buổi
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sessions.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-title">Chưa có buổi tập nào trong kỳ này</p>
          </div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="card-list lg:hidden">
        {sessions.map((session) => (
          <div key={session.id} className="card-list-item">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {new Date(session.session_date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {users.find(u => u.id === session.payer_user_id)?.name || '—'}
                  {session.notes ? ` • ${session.notes}` : ''}
                </p>
              </div>
              <span className={`badge ${session.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>
                {session.status === 'open' ? 'Mở' : 'Đóng'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-[var(--foreground)]">
                {session.court_expense_amount.toLocaleString('vi-VN')} đ
              </p>
              <Link
                href={`/dashboard/sessions/${session.id}`}
                className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer"
              >
                {session.status === 'closed' ? 'Xem' : 'Điểm danh →'}
              </Link>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="empty-state py-8">
            <p className="empty-state-title">Chưa có buổi tập nào</p>
          </div>
        )}
      </div>
    </div>
  );
}

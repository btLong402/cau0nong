'use client';

import { useEffect, useState } from 'react';

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
}

export default function SessionsPage() {
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

    // Default session date to current date or first day of month
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
      
      // Reset form
      setCourtExpense('');
      setNotes('');
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Buổi tập</h1>
          <p className="mt-1 text-sm text-slate-600">Quản lý danh sách buổi tập và thông tin điểm danh.</p>
        </div>
        {selectedMonth && (
          <button
            onClick={() => setShowNewSessionForm((prev) => !prev)}
            className="btn-primary"
          >
            Thêm buổi tập
          </button>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Chọn kỳ quản lý</label>
        <select
          value={selectedMonth || ''}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
          className="input-field max-w-md"
        >
          {months.map((month) => (
            <option key={month.id} value={month.id}>
              {new Date(month.month_year).toLocaleDateString('vi-VN', {
                month: 'long',
                year: 'numeric',
              })} ({month.status === 'open' ? 'Đang mở' : 'Đã đóng'})
            </option>
          ))}
        </select>
      </div>

      {showNewSessionForm && (
        <div className="surface-card-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900">Tạo buổi tập mới</h2>
          {formError && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Ngày *</label>
                <input 
                  type="date" 
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="input-field" 
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Chi phí sân (đ) *</label>
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
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Người ứng tiền *</label>
                <select 
                  value={payerUserId}
                  onChange={(e) => setPayerUserId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Chọn thành viên</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Ghi chú</label>
                <input 
                  type="text" 
                  placeholder="Ứng tiền sân..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field" 
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
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

      <div className="surface-card overflow-hidden">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left font-medium text-gray-700">Ngày</th>
              <th className="px-6 py-4 text-left font-medium text-gray-700">Chi phí sân</th>
              <th className="px-6 py-4 text-left font-medium text-gray-700">Người trả</th>
              <th className="px-6 py-4 text-left font-medium text-gray-700">Ghi chú</th>
              <th className="px-6 py-4 text-left font-medium text-gray-700">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  {new Date(session.session_date).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {session.court_expense_amount.toLocaleString('vi-VN')} đ
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{session.payer_user_id.substring(0, 8)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{session.notes || '-'}</td>
                <td className="px-6 py-4">
                  <a
                    href={`/dashboard/sessions/${session.id}`}
                    className="text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    Điểm danh
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sessions.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-600">Chưa có buổi tập nào trong kỳ này</p>
          </div>
        )}
      </div>
    </div>
  );
}

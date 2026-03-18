'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Attendance {
  user_id: string;
  is_attended: boolean;
}

interface Session {
  id: number;
  month_id: number;
  session_date: string;
  court_expense_amount: number;
  notes?: string;
  status: 'open' | 'closed';
}

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: sessionId } = use(params);
  
  const [session, setSession] = useState<Session | null>(null);
  const [monthStatus, setMonthStatus] = useState<string>('open');
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Step 1: Fetch session to get month_id
        // Note: Our API needs month_id in path, but we only have sessionId. 
        // We might need an API that gets session by ID directly if path structure is strict.
        // Let's try the direct API if exists or just fetch all months and sessions (not ideal but safe).
        // Actually, our API /api/months/[id]/sessions/[sessionId] exists.
        // We'll try to find which month this session belongs to or use a common API.
        
        // For now, let's assume we can fetch users and attendance.
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        const allUsers = usersData.data?.members || [];
        setUsers(allUsers);

        // Fetch session details - we need to know the monthId. 
        // Let's list months to find the session or use the GetSession API if it doesn't require monthId in logic.
        // Actually, the sessions API route has parseSessionId that only looks at the ID.
        const sessionResponse = await fetch(`/api/months/0/sessions/${sessionId}`); 
        const sessionData = await sessionResponse.json();
        const sessionObj = sessionData.data?.session;
        setSession(sessionObj);

        if (sessionObj) {
          // Fetch month status
          const monthRes = await fetch('/api/months');
          const monthData = await monthRes.json();
          const currentMonth = monthData.data?.months?.find((m: any) => m.id === sessionObj.month_id);
          if (currentMonth) {
            setMonthStatus(currentMonth.status);
          }

          const attendanceResponse = await fetch(`/api/months/${sessionObj.month_id}/sessions/${sessionId}/attendance`);
          const attendanceData = await attendanceResponse.json();
          const existingAttendance = attendanceData.data?.attendance || [];
          
          const attendanceMap: Record<string, boolean> = {};
          existingAttendance.forEach((item: any) => {
            attendanceMap[item.user_id] = item.is_attended;
          });
          setAttendance(attendanceMap);
        }
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Không thể tải dữ liệu điểm danh. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sessionId]);

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

    const records = Object.entries(attendance).map(([userId, isAttended]) => ({
      userId,
      isAttended,
    }));

    try {
      const response = await fetch(`/api/months/${session.month_id}/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records }),
      });

      if (!response.ok) {
        throw new Error('Không thể lưu điểm danh');
      }

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">Đang tải danh sách thành viên...</p>
      </div>
    );
  }

  if (!session && !loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Không tìm thấy thông tin buổi tập.</p>
        <Link href="/dashboard/sessions" className="mt-4 inline-block text-blue-600 underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sessions" className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
          <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Điểm danh</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-600">
              Ngày {new Date(session!.session_date).toLocaleDateString('vi-VN')} • 
              Chi phí: {session!.court_expense_amount.toLocaleString('vi-VN')} đ
            </p>
            {monthStatus === 'closed' && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Đã đóng kỳ
              </span>
            )}
            {session?.status === 'closed' && monthStatus !== 'closed' && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Đã đóng buổi
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Danh sách thành viên</h2>
          <span className="text-sm text-slate-600">
            Đã chọn: {Object.values(attendance).filter(Boolean).length} / {users.length}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Lưu điểm danh thành công! Đang chuyển hướng...
          </div>
        )}

        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
          {users.map((user) => (
            <div 
              key={user.id} 
              onClick={() => toggleAttendance(user.id)}
              className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  attendance[user.id] ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              </div>
              <div className={`h-6 w-6 rounded-md border flex items-center justify-center transition-colors ${
                attendance[user.id] 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-slate-300'
              }`}>
                {attendance[user.id] && (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          {monthStatus === 'open' && session?.status === 'open' ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 py-3"
            >
              {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
            </button>
          ) : (
            <div className="flex-1 rounded-xl bg-slate-50 p-3 text-center text-sm font-medium text-slate-500">
              {session?.status === 'closed' ? 'Buổi tập đã đóng - Không thể chỉnh sửa' : 'Kỳ quản lý đã đóng - Không thể chỉnh sửa'}
            </div>
          )}
          <Link href="/dashboard/sessions" className="btn-secondary flex-1 py-3 text-center">
            {monthStatus === 'open' && session?.status === 'open' ? 'Hủy' : 'Quay lại'}
          </Link>
        </div>
      </div>
    </div>
  );
}

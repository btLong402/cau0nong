/**
 * Sessions Hook
 * Manage sessions and attendance records
 */

import { useState, useCallback } from 'react';
import { useFetch } from './useFetch';
import { mutate } from 'swr';
import { apiRequest } from '@/shared/lib';

export interface Session {
  id: number;
  month_id: number;
  session_date: string;
  court_expense_amount: number;
  payer_user_id: string;
  notes?: string;
  status: 'open' | 'closed';
}

export interface Attendance {
  id: number;
  session_id: number;
  user_id: string;
  is_attended: boolean;
}

interface SessionsResponse {
  sessions: Session[];
}

interface SessionResponse {
  session: Session;
}

interface AttendanceResponse {
  attendance: Attendance[];
}

function isSessionKeyForMonth(key: unknown, monthId: number): boolean {
  return (
    typeof key === 'string' &&
    key.startsWith(`/api/months/${monthId}/sessions`)
  );
}

export function useSessions(monthId: number) {
  const url = `/api/months/${monthId}/sessions`;
  const { data, loading, error, refetch } = useFetch<SessionsResponse>(url, {
    skip: monthId <= 0,
  });

  return {
    sessions: data?.sessions || [],
    loading,
    error,
    refetch,
  };
}

export function useSession(monthId: number, sessionId: number) {
  const url = `/api/months/${monthId}/sessions/${sessionId}`;
  const { data, loading, error, refetch } = useFetch<Session | SessionResponse>(url, {
    skip: !sessionId,
  });

  const session = data && 'session' in data ? data.session : data;

  return {
    session: session || null,
    loading,
    error,
    refetch,
  };
}

export function useSessionAttendance(monthId: number, sessionId: number) {
  const url = `/api/months/${monthId}/sessions/${sessionId}/attendance`;
  const { data, loading, error, refetch } = useFetch<AttendanceResponse>(url, {
    skip: !monthId || !sessionId,
  });

  return {
    attendance: data?.attendance || [],
    loading,
    error,
    refetch,
  };
}

export function useCreateSession() {
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
  });

  const create = useCallback(
    async (
      monthId: number,
      sessionDate: string,
      courtExpenseAmount: number,
      payerUserId: string,
      notes?: string,
    ) => {
      setState({ loading: true, error: null });

      try {
        const data = await apiRequest<{ session: Session }>(`/api/months/${monthId}/sessions`, {
          method: 'POST',
          body: JSON.stringify({
            session_date: sessionDate,
            court_expense_amount: courtExpenseAmount,
            payer_user_id: payerUserId,
            notes,
          }),
        });

        await mutate((key) => isSessionKeyForMonth(key, monthId));

        setState({ loading: false, error: null });
        return data.session;
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Không thể tạo buổi tập');
        setState({ loading: false, error: err });
        throw err;
      }
    },
    [],
  );

  return {
    ...state,
    create,
  };
}

export function useUpdateSession() {
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
  });

  const update = useCallback(
    async (monthId: number, sessionId: number, updates: Partial<Session>) => {
      setState({ loading: true, error: null });

      try {
        const data = await apiRequest<{ session: Session }>(
          `/api/months/${monthId}/sessions/${sessionId}`,
          {
            method: 'PUT',
            body: JSON.stringify(updates),
          },
        );

        await mutate((key) => isSessionKeyForMonth(key, monthId));

        setState({ loading: false, error: null });
        return data.session;
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Không thể cập nhật buổi tập');
        setState({ loading: false, error: err });
        throw err;
      }
    },
    [],
  );

  return {
    ...state,
    update,
  };
}

export function useDeleteSession() {
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
  });

  const delete_ = useCallback(
    async (monthId: number, sessionId: number) => {
      setState({ loading: true, error: null });

      try {
        await apiRequest<Record<string, never>>(
          `/api/months/${monthId}/sessions/${sessionId}`,
          {
            method: 'DELETE',
          },
        );

        await mutate((key) => isSessionKeyForMonth(key, monthId));

        setState({ loading: false, error: null });
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Không thể xóa buổi tập');
        setState({ loading: false, error: err });
        throw err;
      }
    },
    [],
  );

  return {
    ...state,
    delete: delete_,
  };
}

export function useRecordAttendance() {
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
  });

  const record = useCallback(
    async (
      monthId: number,
      sessionId: number,
      records: Array<{ user_id: string; is_attended: boolean }>,
    ) => {
      setState({ loading: true, error: null });

      try {
        const data = await apiRequest<{ attendance: Attendance[] }>(
          `/api/months/${monthId}/sessions/${sessionId}/attendance`,
          {
            method: 'POST',
            body: JSON.stringify({ records }),
          },
        );

        await mutate((key) => isSessionKeyForMonth(key, monthId));

        setState({ loading: false, error: null });
        return data.attendance;
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Không thể lưu điểm danh');
        setState({ loading: false, error: err });
        throw err;
      }
    },
    [],
  );

  return {
    ...state,
    record,
  };
}

/**
 * Sessions Hook
 * Manage sessions and attendance records
 */

import { useState, useCallback } from 'react';
import { useFetch } from './useFetch';

export interface Session {
  id: number;
  month_id: number;
  session_date: string;
  court_expense_amount: number;
  payer_user_id: string;
  notes?: string;
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

interface AttendanceResponse {
  attendance: Attendance[];
}

export function useSessions(monthId: number) {
  const url = `/api/months/${monthId}/sessions`;
  const { data, loading, error, refetch } = useFetch<SessionsResponse>(url, {
    skip: !monthId,
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
  const { data, loading, error, refetch } = useFetch<Session>(url, {
    skip: !monthId || !sessionId,
  });

  return {
    session: data || null,
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
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/months/${monthId}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_date: sessionDate,
            court_expense_amount: courtExpenseAmount,
            payer_user_id: payerUserId,
            notes,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to create session');
        }

        setState({ loading: false, error: null });
        return data.data?.session;
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Failed to create session');
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
        const token = localStorage.getItem('auth_token');
        const response = await fetch(
          `/api/months/${monthId}/sessions/${sessionId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to update session');
        }

        setState({ loading: false, error: null });
        return data.data?.session;
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Failed to update session');
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
        const token = localStorage.getItem('auth_token');
        const response = await fetch(
          `/api/months/${monthId}/sessions/${sessionId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to delete session');
        }

        setState({ loading: false, error: null });
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Failed to delete session');
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
        const token = localStorage.getItem('auth_token');
        const response = await fetch(
          `/api/months/${monthId}/sessions/${sessionId}/attendance`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ records }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to record attendance');
        }

        setState({ loading: false, error: null });
        return data.data?.attendance;
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Failed to record attendance');
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

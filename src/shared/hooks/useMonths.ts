/**
 * Months/Billing Cycles Hook
 * Manage billing cycles and related operations
 */

import { useState, useCallback } from 'react';
import { useFetch } from './useFetch';

export interface Month {
  id: number;
  month_year: string;
  status: 'open' | 'closed';
  total_shuttlecock_expense: number;
}

interface MonthsResponse {
  months: Month[];
}

interface ListMonthsFilters {
  status?: 'open' | 'closed';
}

export function useMonths(filters?: ListMonthsFilters) {
  const queryString = new URLSearchParams();
  if (filters?.status) {
    queryString.append('status', filters.status);
  }

  const url = `/api/months${queryString.toString() ? '?' + queryString.toString() : ''}`;
  const { data, loading, error, refetch } = useFetch<MonthsResponse>(url);

  return {
    months: data?.months || [],
    loading,
    error,
    refetch,
  };
}

export function useMonth(monthId: number) {
  const url = `/api/months/${monthId}`;
  const { data, loading, error, refetch } = useFetch<Month>(url, {
    skip: !monthId,
  });

  return {
    month: data || null,
    loading,
    error,
    refetch,
  };
}

export function useCreateMonth() {
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
  });

  const create = useCallback(
    async (monthYear: string, status: 'open' | 'closed' = 'open') => {
      setState({ loading: true, error: null });

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/months', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ month_year: monthYear, status }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to create month');
        }

        setState({ loading: false, error: null });
        return data.data?.month;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Failed to create month');
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

export function useUpdateMonth() {
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
  });

  const update = useCallback(
    async (monthId: number, updates: Partial<Month>) => {
      setState({ loading: true, error: null });

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/months/${monthId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to update month');
        }

        setState({ loading: false, error: null });
        return data.data?.month;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Failed to update month');
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

export function useCloseMonth() {
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
  });

  const close = useCallback(async (monthId: number) => {
    setState({ loading: true, error: null });

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/months/${monthId}/close`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to close month');
      }

      setState({ loading: false, error: null });
      return data.data?.month;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Failed to close month');
      setState({ loading: false, error: err });
      throw err;
    }
  }, []);

  return {
    ...state,
    close,
  };
}

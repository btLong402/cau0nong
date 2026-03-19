/**
 * Months/Billing Cycles Hook
 * Manage billing cycles and related operations
 */

import { useState, useCallback } from 'react';
import { useFetch } from './useFetch';
import { mutate } from 'swr';
import { apiRequest } from '@/shared/lib';

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
        const data = await apiRequest<{ month: Month }>('/api/months', {
          method: 'POST',
          body: JSON.stringify({ month_year: monthYear, status }),
        });

        await mutate((key) => typeof key === 'string' && key.startsWith('/api/months'));

        setState({ loading: false, error: null });
        return data.month;
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
        const data = await apiRequest<{ month: Month }>(`/api/months/${monthId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });

        await mutate((key) => typeof key === 'string' && key.startsWith('/api/months'));

        setState({ loading: false, error: null });
        return data.month;
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
      const data = await apiRequest<{ month: Month }>(`/api/months/${monthId}/close`, {
        method: 'PUT',
      });

      await mutate((key) => typeof key === 'string' && key.startsWith('/api/months'));

      setState({ loading: false, error: null });
      return data.month;
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

/**
 * Settlements Hooks
 * Query and mutation helpers for settlement generation and payment confirmation.
 */

import { MonthlySetting } from '@/lib/types';
import { useCallback, useState } from 'react';
import { useFetch } from './useFetch';
import {
  GeneratedVietQR,
  GenerateResponse,
  GenerateSummary,
  MonthPaymentItem,
  MonthPaymentResponse,
  MonthSettlementsResponse,
  MutationState,
  SettlementListItem,
  SettlementResponse,
  SettlementVietQRResponse,
  UseMonthPaymentHistoryOptions,
  UseMonthSettlementsOptions,
  VietQRPayload,
} from './useSettlements.types';

export function useMonthSettlements(
  monthId: number | null,
  options?: UseMonthSettlementsOptions,
) {
  const query = new URLSearchParams();
  query.set('page', String(options?.page || 1));
  query.set('limit', String(options?.limit || 20));
  query.set('status', options?.status || 'all');
  query.set('sortBy', options?.sortBy || 'total_due');
  query.set('sortOrder', options?.sortOrder || 'desc');

  const normalizedSearch = options?.search?.trim();
  if (normalizedSearch) {
    query.set('search', normalizedSearch);
  }

  const url = monthId
    ? `/api/months/${monthId}/settlements?${query.toString()}`
    : '/api/months/0/settlements';

  const { data, loading, error, refetch } = useFetch<MonthSettlementsResponse>(url, {
    skip: !monthId,
  });

  return {
    settlements: data?.items || [],
    pagination: data?.pagination || {
      page: options?.page || 1,
      limit: options?.limit || 20,
      total: 0,
      totalPages: 1,
      hasMore: false,
    },
    loading,
    error,
    refetch,
  };
}

export function useSettlement(settlementId: number | null) {
  const url = settlementId ? `/api/settlements/${settlementId}` : '/api/settlements/0';
  const { data, loading, error, refetch } = useFetch<SettlementResponse>(url, {
    skip: !settlementId,
  });

  return {
    settlement: data?.settlement || null,
    loading,
    error,
    refetch,
  };
}

export function useSettlementVietQR(
  settlementId: number | null,
  autoFetch: boolean = true,
) {
  const url = settlementId
    ? `/api/settlements/${settlementId}/vietqr`
    : '/api/settlements/0/vietqr';

  const { data, loading, error, refetch } = useFetch<SettlementVietQRResponse>(url, {
    skip: !settlementId || !autoFetch,
  });

  return {
    vietqr: data?.vietqr || null,
    loading,
    error,
    refetch,
  };
}

export function useMonthPaymentHistory(
  monthId: number | null,
  options?: UseMonthPaymentHistoryOptions,
) {
  const query = new URLSearchParams();
  query.set('page', String(options?.page || 1));
  query.set('limit', String(options?.limit || 20));
  query.set('status', options?.status || 'all');

  const normalizedSearch = options?.search?.trim();
  if (normalizedSearch) {
    query.set('search', normalizedSearch);
  }

  const url = monthId
    ? `/api/months/${monthId}/payments?${query.toString()}`
    : '/api/months/0/payments';

  const { data, loading, error, refetch } = useFetch<MonthPaymentResponse>(url, {
    skip: !monthId,
  });

  return {
    payments: data?.items || [],
    pagination: data?.pagination || {
      page: options?.page || 1,
      limit: options?.limit || 20,
      total: 0,
      totalPages: 1,
      hasMore: false,
    },
    loading,
    error,
    refetch,
  };
}

export function useGenerateMonthSettlements(monthId: number | null) {
  const [state, setState] = useState<MutationState<GenerateSummary>>({
    data: null,
    loading: false,
    error: null,
  });

  const generate = useCallback(
    async (force: boolean = false) => {
      if (!monthId) {
        throw new Error('Cần monthId để tạo quyết toán');
      }

      setState({ data: null, loading: true, error: null });

      try {
        const response = await fetch(`/api/months/${monthId}/settlements`, {
          credentials: 'include',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ force }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error?.message || 'Không thể tạo quyết toán');
        }

        const summary: GenerateSummary | null = payload.data?.summary || null;
        setState({ data: summary, loading: false, error: null });
        return summary;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Không thể tạo quyết toán');
        setState({ data: null, loading: false, error: err });
        throw err;
      }
    },
    [monthId],
  );

  return {
    ...state,
    generate,
  };
}

export function useMonthShuttlecocks(monthId: number | null) {
  const url = monthId
    ? `/api/months/${monthId}/shuttlecocks`
    : '/api/months/0/shuttlecocks';

  const { data, loading, error, refetch } = useFetch<{ items: unknown[] }>(url, {
    skip: !monthId,
  });

  return {
    shuttlecocks: data?.items || [],
    loading,
    error,
    refetch,
  };
}

export function useMarkSettlementPaid() {
  const [state, setState] = useState<MutationState<MonthlySetting>>({
    data: null,
    loading: false,
    error: null,
  });

  const markPaid = useCallback(async (settlementId: number, paidAmount?: number) => {
    if (!settlementId || settlementId <= 0) {
      throw new Error('settlementId phải là số nguyên dương');
    }

    setState({ data: null, loading: true, error: null });

    try {
      const response = await fetch(`/api/settlements/${settlementId}/pay`, {
        credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          paidAmount !== undefined ? { paid_amount: paidAmount } : {},
        ),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message || 'Không thể đánh dấu khoản quyết toán đã thanh toán');
      }

      const settlement: MonthlySetting | null = payload.data?.settlement || null;
      setState({ data: settlement, loading: false, error: null });
      return settlement;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Không thể đánh dấu khoản quyết toán đã thanh toán');
      setState({ data: null, loading: false, error: err });
      throw err;
    }
  }, []);

  return {
    ...state,
    markPaid,
  };
}

export type {
  GenerateSummary,
  SettlementListItem,
  SettlementResponse,
  GenerateResponse,
  SettlementVietQRResponse,
  GeneratedVietQR,
  VietQRPayload,
  MonthPaymentItem,
  MonthPaymentResponse,
};

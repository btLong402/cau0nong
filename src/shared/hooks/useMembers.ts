/**
 * Members Hook
 * Manage member list, pagination, and member details
 */

import { useState, useCallback, useEffect } from 'react';
import { useFetch } from './useFetch';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'member';
  balance: number;
  is_active: boolean;
}

interface MembersResponse {
  members: Member[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function useMembers(page: number = 1, limit: number = 20) {
  const url = `/api/users?page=${page}&limit=${limit}`;
  const { data, loading, error, refetch } = useFetch<MembersResponse>(url);

  return {
    members: data?.members || [],
    total: data?.total || 0,
    page,
    limit,
    hasMore: data?.hasMore || false,
    loading,
    error,
    refetch,
  };
}

export function useMember(memberId: string) {
  const url = `/api/users/${memberId}`;
  const { data, loading, error, refetch } = useFetch<Member>(url, {
    skip: !memberId,
  });

  return {
    member: data || null,
    loading,
    error,
    refetch,
  };
}

export function useUpdateMember() {
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
  });

  const update = useCallback(
    async (memberId: string, updates: Partial<Member>) => {
      setState({ loading: true, error: null });

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/users/${memberId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to update member');
        }

        setState({ loading: false, error: null });
        return data.data?.user;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Failed to update member');
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

export function useUpdateMemberBalance() {
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
  });

  const updateBalance = useCallback(
    async (memberId: string, amount: number) => {
      setState({ loading: true, error: null });

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/users/${memberId}/balance`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to update balance');
        }

        setState({ loading: false, error: null });
        return data.data?.user;
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Failed to update balance');
        setState({ loading: false, error: err });
        throw err;
      }
    },
    [],
  );

  return {
    ...state,
    updateBalance,
  };
}

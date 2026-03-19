/**
 * Members Hook
 * Manage member list, pagination, and member details
 */

import { useState, useCallback } from 'react';
import { useFetch } from './useFetch';
import { mutate } from 'swr';
import { apiRequest } from '@/shared/lib';

export interface Member {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'member';
  balance: number;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

interface MembersResponse {
  members: Member[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface MemberResponse {
  user: Member;
}

interface UseMembersOptions {
  enabled?: boolean;
}

export function useMembers(
  page: number = 1,
  limit: number = 20,
  options?: UseMembersOptions,
) {
  const url = `/api/users?page=${page}&limit=${limit}`;
  const { data, loading, error, refetch } = useFetch<MembersResponse>(url, {
    skip: options?.enabled === false,
  });

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
  const { data, loading, error, refetch } = useFetch<MemberResponse | Member>(url, {
    skip: !memberId,
  });

  return {
    member: (data && 'user' in data ? data.user : data) || null,
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
        const data = await apiRequest<{ user: Member }>(`/api/users/${memberId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });

        await mutate((key) => typeof key === 'string' && key.startsWith('/api/users'));

        setState({ loading: false, error: null });
        return data.user;
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
        const data = await apiRequest<{ user: Member }>(`/api/users/${memberId}/balance`, {
          method: 'PUT',
          body: JSON.stringify({ amount }),
        });

        await mutate((key) => typeof key === 'string' && key.startsWith('/api/users'));

        setState({ loading: false, error: null });
        return data.user;
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

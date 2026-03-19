/**
 * Generic Hook for API Fetching
 * Handles loading, error, and data states for GET requests
 */

import useSWR from 'swr';
import { apiFetcher } from '@/shared/lib';

export interface UseFetchOptions {
  skip?: boolean;
  refetch?: number; // milliseconds to refetch
  revalidateOnFocus?: boolean;
  dedupingInterval?: number;
}

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFetch<T>(
  url: string,
  options?: UseFetchOptions,
): UseFetchState<T> & { refetch: () => Promise<void> } {
  const { data, error, isLoading, mutate } = useSWR<T>(
    options?.skip ? null : url,
    apiFetcher,
    {
      refreshInterval: options?.refetch,
      revalidateOnFocus: options?.revalidateOnFocus,
      dedupingInterval: options?.dedupingInterval,
    },
  );

  async function refetch() {
    await mutate();
  }

  return {
    data: data ?? null,
    loading: Boolean(!options?.skip && isLoading),
    error: (error as Error | null) ?? null,
    refetch,
  };
}

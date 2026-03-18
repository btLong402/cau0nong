/**
 * Generic Hook for API Fetching
 * Handles loading, error, and data states for GET requests
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseFetchOptions {
  skip?: boolean;
  refetch?: number; // milliseconds to refetch
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
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setState({
        data: data.data || null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [url]);

  useEffect(() => {
    if (options?.skip) {
      setState({
        data: null,
        loading: false,
        error: null,
      });
      return;
    }

    refetch();

    if (options?.refetch) {
      const interval = setInterval(refetch, options.refetch);
      return () => clearInterval(interval);
    }
  }, [url, options?.skip, options?.refetch, refetch]);

  return {
    ...state,
    refetch,
  };
}

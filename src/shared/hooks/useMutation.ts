/**
 * Generic Hook for API Mutations
 * Handles POST, PUT, PATCH, DELETE operations with loading and error states
 */

import { useState, useCallback } from 'react';

interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useMutation<T, V = any>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: UseMutationOptions<T>,
) {
  const [state, setState] = useState<MutationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (payload?: V) => {
      setState({
        data: null,
        loading: true,
        error: null,
      });

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: payload ? JSON.stringify(payload) : undefined,
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.error?.message || `HTTP ${response.status}`,
          );
        }

        const result = responseData.data || null;
        setState({
          data: result,
          loading: false,
          error: null,
        });

        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        setState({
          data: null,
          loading: false,
          error: err,
        });

        options?.onError?.(err);
        throw err;
      }
    },
    [url, method, options],
  );

  return {
    ...state,
    mutate,
    reset: () => {
      setState({
        data: null,
        loading: false,
        error: null,
      });
    },
  };
}

/**
 * Authentication Hook
 * Manages login, logout, and user state
 */

import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'member';
  balance: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  // Initialize auth from server session cookie.
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'include',
        });

      if (!response.ok) {
        setState({
          user: null,
          token: null,
          loading: false,
          error: null,
        });
        return;
      }

      const data = await response.json();
      setState({
        user: data.data?.user || null,
        token: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: null,
        token: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch user'),
      });
    }
  }

  const login = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Login failed');
        }

        setState({
          user: data.data?.user,
          token: data.data?.token || null,
          loading: false,
          error: null,
        });

        return { user: data.data?.user, token: data.data?.token || null };
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Login failed');
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err,
        }));
        throw err;
      }
    },
    [],
  );

  const signup = useCallback(
    async (
      username: string,
      name: string,
      email: string,
      phone: string,
      password: string,
    ) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            name,
            email,
            phone,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Registration failed');
        }

        // After signup, user needs to login
        setState({
          user: null,
          token: null,
          loading: false,
          error: null,
        });

        return data.data?.user;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Registration failed');
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err,
        }));
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setState({
        user: null,
        token: null,
        loading: false,
        error: null,
      });
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const newToken = data.data?.token;

      setState({
        user: data.data?.user,
        token: newToken || null,
        loading: false,
        error: null,
      });

      return newToken;
    } catch (error) {
      // Token refresh failed, logout
      logout();
    }
  }, [state.token, logout]);

  return {
    ...state,
    isAuthenticated: !!state.user,
    login,
    signup,
    logout,
    refreshToken,
  };
}

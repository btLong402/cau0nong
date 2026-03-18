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

  // Initialize auth from localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setState((prev) => ({
        ...prev,
        token,
        loading: true,
      }));
      // Try to fetch current user
      fetchCurrentUser(token);
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, []);

  async function fetchCurrentUser(token: string) {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token invalid, clear it
        localStorage.removeItem('auth_token');
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
        token,
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

        const token = data.data?.token;
        localStorage.setItem('auth_token', token);

        setState({
          user: data.data?.user,
          token,
          loading: false,
          error: null,
        });

        return { user: data.data?.user, token };
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
    const token = state.token;

    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setState({
        user: null,
        token: null,
        loading: false,
        error: null,
      });
    }
  }, [state.token]);

  const refreshToken = useCallback(async () => {
    const token = state.token;
    if (!token) return;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const newToken = data.data?.token;
      localStorage.setItem('auth_token', newToken);

      setState({
        user: data.data?.user,
        token: newToken,
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

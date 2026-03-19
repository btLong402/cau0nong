/**
 * Authentication Hook
 * Manages login, logout, and user state
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AuthState,
  getAuthState,
  isAuthInitialized,
  markAuthInitialized,
  publishAuthState,
  subscribeAuthState,
  syncCurrentUser,
  updateAuthState,
} from './auth-store';

export type { User } from './auth-store';

export function useAuth() {
  const [state, setState] = useState<AuthState>(getAuthState());

  // Initialize auth from server session cookie.
  useEffect(() => {
    const unsubscribe = subscribeAuthState(setState);

    const handleUserUpdated = () => {
      void syncCurrentUser(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:user-updated', handleUserUpdated);
    }

    if (!isAuthInitialized()) {
      void syncCurrentUser();
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:user-updated', handleUserUpdated);
      }
    };
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      updateAuthState((prev) => ({
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
          credentials: 'include',
          body: JSON.stringify({ identifier, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Login failed');
        }

        publishAuthState({
          user: data.data?.user,
          token: data.data?.token || null,
          loading: false,
          error: null,
        });
        markAuthInitialized(true);

        return { user: data.data?.user, token: data.data?.token || null };
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Login failed');
        updateAuthState((prev) => ({
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
      updateAuthState((prev) => ({
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
        publishAuthState({
          user: null,
          token: null,
          loading: false,
          error: null,
        });
        markAuthInitialized(true);

        return data.data?.user;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Registration failed');
        updateAuthState((prev) => ({
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
      publishAuthState({
        user: null,
        token: null,
        loading: false,
        error: null,
      });
      markAuthInitialized(true);
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

      publishAuthState({
        user: data.data?.user,
        token: newToken || null,
        loading: false,
        error: null,
      });
      markAuthInitialized(true);

      return newToken;
    } catch {
      // Token refresh failed, logout
      await logout();
      return null;
    }
  }, [logout]);

  return {
    ...state,
    isAuthenticated: !!state.user,
    login,
    signup,
    logout,
    refreshToken,
  };
}

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

const initialAuthState: AuthState = {
  user: null,
  token: null,
  loading: true,
  error: null,
};

let authStateCache: AuthState = initialAuthState;
let authInitialized = false;
let authRequestInFlight: Promise<void> | null = null;
const authSubscribers = new Set<(state: AuthState) => void>();
let pendingStateUpdate: AuthState | null = null;
let updateScheduled = false;

function scheduleStateUpdate(nextState: AuthState) {
  pendingStateUpdate = nextState;
  
  if (!updateScheduled) {
    updateScheduled = true;
    // Batch updates in microtask queue
    Promise.resolve().then(() => {
      if (pendingStateUpdate) {
        authStateCache = pendingStateUpdate;
        authSubscribers.forEach((subscriber) => subscriber(authStateCache));
        pendingStateUpdate = null;
      }
      updateScheduled = false;
    });
  }
}

function publishAuthState(nextState: AuthState) {
  // Only update if state actually changed
  if (
    authStateCache.user?.id === nextState.user?.id &&
    authStateCache.loading === nextState.loading &&
    authStateCache.error === nextState.error
  ) {
    return;
  }
  
  scheduleStateUpdate(nextState);
}

function updateAuthState(updater: (prev: AuthState) => AuthState) {
  publishAuthState(updater(authStateCache));
}

async function syncCurrentUser(force = false): Promise<void> {
  if (authRequestInFlight) {
    return authRequestInFlight;
  }

  if (authInitialized && !force) {
    return;
  }

  authRequestInFlight = (async () => {
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        publishAuthState({
          user: null,
          token: null,
          loading: false,
          error: null,
        });
        authInitialized = true;
        return;
      }

      const data = await response.json();
      publishAuthState({
        user: data.data?.user || null,
        token: null,
        loading: false,
        error: null,
      });
      authInitialized = true;
    } catch (error) {
      publishAuthState({
        user: null,
        token: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch user'),
      });
      authInitialized = true;
    } finally {
      authRequestInFlight = null;
    }
  })();

  return authRequestInFlight;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(authStateCache);

  // Initialize auth from server session cookie.
  useEffect(() => {
    authSubscribers.add(setState);

    if (!authInitialized && !authRequestInFlight) {
      void syncCurrentUser();
    }

    return () => {
      authSubscribers.delete(setState);
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
        authInitialized = true;

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
        authInitialized = true;

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
      authInitialized = true;
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
      authInitialized = true;

      return newToken;
    } catch (error) {
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

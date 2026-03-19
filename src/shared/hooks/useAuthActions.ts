import { useCallback } from 'react';

import {
  markAuthInitialized,
  publishAuthState,
  updateAuthState,
} from './auth-store';
import {
  loginRequest,
  logoutRequest,
  refreshTokenRequest,
  registerRequest,
} from './auth.api';

function setLoadingState() {
  updateAuthState((prev) => ({
    ...prev,
    loading: true,
    error: null,
  }));
}

function publishSignedOutState() {
  publishAuthState({
    user: null,
    token: null,
    loading: false,
    error: null,
  });
  markAuthInitialized(true);
}

export function useAuthActions() {
  const login = useCallback(
    async (identifier: string, password: string) => {
      setLoadingState();

      try {
        const data = await loginRequest(identifier, password);

        publishAuthState({
          user: data.user,
          token: data.token,
          loading: false,
          error: null,
        });
        markAuthInitialized(true);

        return { user: data.user, token: data.token };
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Login failed');
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
      setLoadingState();

      try {
        const user = await registerRequest({
          username,
          name,
          email,
          phone,
          password,
        });

        publishSignedOutState();

        return user;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Registration failed');
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
      await logoutRequest();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      publishSignedOutState();
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const data = await refreshTokenRequest();

      publishAuthState({
        user: data.user,
        token: data.token || null,
        loading: false,
        error: null,
      });
      markAuthInitialized(true);

      return data.token;
    } catch {
      await logout();
      return null;
    }
  }, [logout]);

  return {
    login,
    signup,
    logout,
    refreshToken,
  };
}

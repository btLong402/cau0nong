/**
 * Authentication Hook
 * Manages login, logout, and user state
 */

import { useState, useEffect } from 'react';
import {
  AuthState,
  getAuthState,
  isAuthInitialized,
  subscribeAuthState,
  syncCurrentUser,
} from './auth-store';
import { useAuthActions } from './useAuthActions';

export type { User } from './auth-store';

export function useAuth() {
  const [state, setState] = useState<AuthState>(getAuthState());
  const { login, signup, logout, refreshToken } = useAuthActions();

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

  return {
    ...state,
    isAuthenticated: !!state.user,
    login,
    signup,
    logout,
    refreshToken,
  };
}

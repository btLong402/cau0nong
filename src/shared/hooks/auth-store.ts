import { Dispatch, SetStateAction } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "member";
  balance: number;
  avatar_url?: string | null;
}

export interface AuthState {
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
const authSubscribers = new Set<Dispatch<SetStateAction<AuthState>>>();

let pendingStateUpdate: AuthState | null = null;
let updateScheduled = false;

function scheduleStateUpdate(nextState: AuthState) {
  pendingStateUpdate = nextState;

  if (updateScheduled) {
    return;
  }

  updateScheduled = true;

  Promise.resolve().then(() => {
    if (pendingStateUpdate) {
      authStateCache = pendingStateUpdate;
      authSubscribers.forEach((subscriber) => subscriber(authStateCache));
      pendingStateUpdate = null;
    }

    updateScheduled = false;
  });
}

function isSameUser(currentUser: User | null, nextUser: User | null) {
  return (
    currentUser?.id === nextUser?.id &&
    currentUser?.name === nextUser?.name &&
    currentUser?.email === nextUser?.email &&
    currentUser?.phone === nextUser?.phone &&
    currentUser?.role === nextUser?.role &&
    currentUser?.balance === nextUser?.balance &&
    currentUser?.avatar_url === nextUser?.avatar_url
  );
}

export function getAuthState(): AuthState {
  return authStateCache;
}

export function subscribeAuthState(subscriber: Dispatch<SetStateAction<AuthState>>) {
  authSubscribers.add(subscriber);

  return () => {
    authSubscribers.delete(subscriber);
  };
}

export function markAuthInitialized(value: boolean) {
  authInitialized = value;
}

export function isAuthInitialized() {
  return authInitialized;
}

export function publishAuthState(nextState: AuthState) {
  if (
    isSameUser(authStateCache.user, nextState.user) &&
    authStateCache.token === nextState.token &&
    authStateCache.loading === nextState.loading &&
    authStateCache.error === nextState.error
  ) {
    return;
  }

  scheduleStateUpdate(nextState);
}

export function updateAuthState(updater: (prev: AuthState) => AuthState) {
  publishAuthState(updater(authStateCache));
}

export async function syncCurrentUser(force = false): Promise<void> {
  if (authRequestInFlight) {
    return authRequestInFlight;
  }

  if (authInitialized && !force) {
    return;
  }

  authRequestInFlight = (async () => {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
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
    } catch (error: unknown) {
      publishAuthState({
        user: null,
        token: null,
        loading: false,
        error: error instanceof Error ? error : new Error("Failed to fetch user"),
      });
      authInitialized = true;
    } finally {
      authRequestInFlight = null;
    }
  })();

  return authRequestInFlight;
}

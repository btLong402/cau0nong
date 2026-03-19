import type { User } from './auth-store';

interface LoginResponseData {
  user: User | null;
  token: string | null;
}

interface RegisterPayload {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}

function asErrorMessage(payload: unknown, fallback: string): string {
  const maybePayload = payload as { error?: { message?: string } };
  return maybePayload?.error?.message || fallback;
}

export async function loginRequest(identifier: string, password: string): Promise<LoginResponseData> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ identifier, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(asErrorMessage(payload, 'Login failed'));
  }

  return {
    user: payload.data?.user,
    token: payload.data?.token || null,
  };
}

export async function registerRequest(data: RegisterPayload): Promise<User> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(asErrorMessage(payload, 'Registration failed'));
  }

  return payload.data?.user as User;
}

export async function logoutRequest() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function refreshTokenRequest(): Promise<LoginResponseData> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return {
    user: (payload.data?.user as User) || null,
    token: payload.data?.token || null,
  };
}

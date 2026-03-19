/**
 * Shared API client for browser-side requests.
 * Provides consistent error mapping and response unwrapping.
 */

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

interface ApiErrorPayload {
  code?: string;
  message?: string;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: ApiErrorPayload | string;
}

function resolveErrorMessage(
  payload: ApiEnvelope<unknown> | null,
  fallbackMessage: string,
): { message: string; code?: string } {
  if (!payload?.error) {
    return { message: fallbackMessage };
  }

  if (typeof payload.error === 'string') {
    return { message: payload.error };
  }

  return {
    message: payload.error.message || fallbackMessage,
    code: payload.error.code,
  };
}

export async function apiRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const fallback = `HTTP ${response.status}`;
    const { message, code } = resolveErrorMessage(payload, fallback);
    throw new ApiRequestError(message, response.status, code);
  }

  return (payload?.data as T) ?? ({} as T);
}

export async function apiFetcher<T>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: 'GET' });
}

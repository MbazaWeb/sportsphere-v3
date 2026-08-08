/**
 * Sportsphere API Client
 * ----------------------
 * Typed fetch wrapper around the Next.js Route Handlers.
 *
 * Used by:
 *   - Web (Next.js) — same origin, baseURL defaults to ''
 *   - Mobile (Expo RN) — set EXPO_PUBLIC_API_URL to the deployed API
 *
 * Token storage is platform-specific:
 *   - Web:    httpOnly cookies (set by the API) — no manual token handling
 *   - Mobile: caller passes a token getter/setter; client sends Authorization header
 */

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '@sportsphere/types/auth.js';

export interface ApiClientConfig {
  /** Base URL of the Next.js API. Empty string for same-origin web. */
  baseURL: string;
  /** Returns the current JWT, if any. Used by mobile. Web leaves undefined. */
  getToken?: () => string | null | undefined;
  /** Called when 401 is received — caller clears local session. */
  onUnauthorized?: () => void;
  /** Optional fetch override (testing / RN custom fetch). */
  fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createApiClient(config: ApiClientConfig) {
  const fetchFn = config.fetchImpl ?? fetch;

  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const url = `${config.baseURL}${path}`;
    const token = config.getToken?.();

    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // Same-origin web relies on cookies; RN must send credentials explicitly when needed.
    if (config.baseURL === '') {
      // web — same origin
      (init as any).credentials = init.credentials ?? 'include';
    }

    const res = await fetchFn(url, { ...init, headers });
    const text = await res.text();
    const data = text ? safeJsonParse(text) : null;

    if (!res.ok) {
      if (res.status === 401) {
        config.onUnauthorized?.();
      }
      const code = data?.code ?? `HTTP_${res.status}`;
      const message = data?.message ?? res.statusText ?? 'Request failed';
      throw new ApiError(res.status, code, message, data);
    }

    return data as T;
  }

  return {
    request,

    get:  <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put:  <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'PUT',  body: body ? JSON.stringify(body) : undefined }),
    patch:<T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    del:  <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
  };
}

function safeJsonParse(text: string): any {
  try { return JSON.parse(text); } catch { return text; }
}

// ─── Auth convenience namespace ────────────────────────────────────

export function createAuthApi(client: ReturnType<typeof createApiClient>) {
  return {
    login:    (body: LoginRequest)    => client.post<AuthResponse>('/api/auth', body),
    register: (body: RegisterRequest) => client.post<AuthResponse>('/api/auth/register', body),
    me:       ()                       => client.get<AuthResponse>('/api/auth/me'),
    logout:   ()                       => client.post<{ success: boolean }>('/api/auth/logout'),
    verifyEmailRequest: () =>
      client.post<{ success: boolean }>('/api/auth/verify-email/request'),
    verifyEmailConfirm: (token: string) =>
      client.post<AuthResponse>('/api/auth/verify-email/confirm', { token }),
    forgotPassword: (email: string) =>
      client.post<{ success: boolean }>('/api/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
      client.post<AuthResponse>('/api/auth/reset-password', { token, password }),
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;

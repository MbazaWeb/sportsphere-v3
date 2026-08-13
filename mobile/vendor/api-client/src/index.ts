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
 *
 * Auth endpoints (login, register, me) return AuthResponse {user, token, expiresAt}.
 * The server's /api/auth and /api/auth/register return the public user object directly
 * AND set an HttpOnly cookie with the JWT. On mobile, we extract the JWT from the
 * Set-Cookie header (RN fetch exposes it on Android; on iOS it's also accessible).
 * On web, the browser handles cookies automatically and the token field is informational.
 */

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '@sportsphere/types/auth';

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

// Session TTL — must match the server (7 days in seconds).
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * Pull the JWT value out of a Set-Cookie header line.
 * The server sets `ss_session=<jwt>; Path=/; Max-Age=...; HttpOnly; SameSite=Lax`.
 */
export function extractTokenFromSetCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  // On RN, multiple Set-Cookie headers may be joined with commas; we just
  // look for the ss_session= prefix.
  const match = setCookie.match(/ss_session=([^;]+)/);
  return match ? match[1] : null;
}

export function createApiClient(config: ApiClientConfig) {
  const fetchFn = config.fetchImpl ?? fetch;

  /**
   * Core request method. Returns the parsed JSON body AND the response
   * object so auth methods can read Set-Cookie headers.
   */
  async function requestRaw<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<{ data: T; response: Response }> {
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

    const response = await fetchFn(url, { ...init, headers });
    const text = await response.text();
    const data = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      if (response.status === 401) {
        config.onUnauthorized?.();
      }
      const code = data?.code ?? `HTTP_${response.status}`;
      const message =
        data?.message ?? data?.error ?? response.statusText ?? 'Request failed';
      throw new ApiError(response.status, code, message, data);
    }

    return { data: data as T, response };
  }

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const { data } = await requestRaw<T>(path, init);
    return data;
  }

  /**
   * Auth POST helper that returns the full AuthResponse (with token).
   * The server returns either:
   *   - { user, token, expiresAt } (preferred shape), OR
   *   - the user object directly (legacy shape) + a Set-Cookie header
   * We normalize to AuthResponse.
   */
  async function authPost(path: string, body: unknown): Promise<AuthResponse> {
    const { data, response } = await requestRaw<
      | AuthResponse
      | AuthResponse['user']
      | { user: AuthResponse['user']; token?: string; expiresAt?: number }
    >(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

    // Normalize: support {user, token, expiresAt}, {user}, or user-directly shapes
    const user = (data as any)?.user ?? (data as any);
    let token: string | undefined = (data as any)?.token;
    if (!token) {
      // Fall back to the Set-Cookie header (mobile RN)
      const setCookie =
        response.headers.get('Set-Cookie') ?? response.headers.get('set-cookie');
      token = extractTokenFromSetCookie(setCookie) ?? undefined;
    }
    const expiresAt =
      (data as any)?.expiresAt ?? (Date.now() + SESSION_TTL_SECONDS * 1000);

    if (!token) {
      throw new ApiError(
        500,
        'NO_TOKEN',
        'Login succeeded but no JWT was returned in body or Set-Cookie header.',
      );
    }

    return { user, token, expiresAt };
  }

  return {
    request,
    requestRaw,
    authPost,

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
    /** POST /api/auth — login with email or handle + password */
    login:    (body: LoginRequest)    => client.authPost('/api/auth', body),
    /** POST /api/auth/register — create a new Fan account */
    register: (body: RegisterRequest) => client.authPost('/api/auth/register', body),
    /** GET /api/auth/me — current session (returns {user: null} when logged out) */
    me:       () =>
      client.get<
        | { user: AuthResponse['user'] | null; token?: string; expiresAt?: number }
        | AuthResponse['user']
        | null
      >('/api/auth/me'),
    /** POST /api/auth/logout */
    logout:   () => client.post<{ success: boolean }>('/api/auth/logout'),
    verifyEmailRequest: () =>
      client.post<{ success: boolean }>('/api/auth/verify-email/request'),
    verifyEmailConfirm: (token: string) =>
      client.authPost('/api/auth/verify-email/confirm', { token }),
    forgotPassword: (email: string) =>
      client.post<{ success: boolean }>('/api/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
      client.authPost('/api/auth/reset-password', { token, password }),
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;

// ─── Re-export domain APIs ────────────────────────────────────────
export { createFeedApi } from './feed';
export type FeedApi = ReturnType<typeof import('./feed').createFeedApi>;

export { createPerformanceApi } from './performance';
export type PerformanceApi = ReturnType<typeof import('./performance').createPerformanceApi>;
export type { PerformanceResponse, PerformanceTier as PerformanceTierDto } from './performance';

export { createLeaderboardApi } from './leaderboard';
export type LeaderboardApi = ReturnType<typeof import('./leaderboard').createLeaderboardApi>;
export type { LeaderboardEntry, LeaderboardDimension } from './leaderboard';

export { createNotificationsApi } from './notifications';
export type NotificationsApi = ReturnType<typeof import('./notifications').createNotificationsApi>;
export type { Notification, NotificationType } from './notifications';

export { createSportsApi } from './sports';
export type SportsApi = ReturnType<typeof import('./sports').createSportsApi>;
export type { Sport } from './sports';

export { createPostsApi } from './posts';
export type PostsApi = ReturnType<typeof import('./posts').createPostsApi>;
export type { CreatePostBody } from './posts';

export { createProfileApi } from './profile';
export type ProfileApi = ReturnType<typeof import('./profile').createProfileApi>;

export { createFollowsApi } from './follows';
export type FollowsApi = ReturnType<typeof import('./follows').createFollowsApi>;

export { createCommentsApi } from './comments';
export type CommentsApi = ReturnType<typeof import('./comments').createCommentsApi>;
export type { Comment, CreateCommentBody } from './comments';

export { createMessagesApi } from './messages';
export type MessagesApi = ReturnType<typeof import('./messages').createMessagesApi>;
export type { Conversation, Message as MessageDto } from './messages';

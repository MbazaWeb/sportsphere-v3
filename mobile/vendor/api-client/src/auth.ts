import type { LoginRequest, RegisterRequest, AuthResponse } from '@sportsphere/types/auth';
import { createApiClient } from './index';

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

/**
 * Auth-related shared types
 * Consumed by: web (Next.js), mobile (Expo RN), api-client
 */

export type UserRole =
  | 'FAN'
  | 'PLAYER'
  | 'COACH'
  | 'TEAM'
  | 'AGENT'
  | 'SCOUT'
  | 'JOURNALIST'
  | 'ANALYST'
  | 'ACADEMY'
  | 'COMMENTATOR'
  | 'CREATOR'
  | 'VENUE'
  | 'LEAGUE'
  | 'COMPETITION'
  | 'ORGANIZATION'
  | 'BUSINESS'
  | 'COMMERCIAL_PARTNER'
  | 'ADMIN'
  | 'MODERATOR';

export type AdminRole = 'ADMIN' | 'MODERATOR';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    handle: string;
    displayName: string;
    avatarUrl?: string | null;
    role: UserRole;
  };
  token: string;       // JWT
  expiresAt: number;   // epoch ms
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  handle: string;
  displayName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthSession['user'];
  token: string;
  expiresAt: number;
}

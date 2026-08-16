/**
 * Auth-related shared types
 * Consumed by: web (Next.js), mobile (Expo RN), api-client
 *
 * The `PublicUser` shape mirrors what `serializePublicUser()` returns
 * from the Next.js API routes (src/lib/auth.ts). All auth endpoints
 * (login, register, me) return AuthResponse with this user shape.
 */

export type UserRole =
  | 'fan'
  | 'player'
  | 'coach'
  | 'team'
  | 'agent'
  | 'scout'
  | 'journalist'
  | 'analyst'
  | 'academy'
  | 'commentator'
  | 'creator'
  | 'venue'
  | 'league'
  | 'competition'
  | 'organization'
  | 'business'
  | 'commercial-partner'
  | 'community'
  | 'referee'
  | 'stadium'
  | 'medical'
  | 'developer'
  | 'admin'
  | 'moderator';

export type AdminRole = 'admin' | 'moderator';

/**
 * The full public user shape returned by /api/auth, /api/auth/register,
 * /api/auth/me, /api/profile, /api/users/[id], etc.
 *
 * Mirrors `serializePublicUser()` in src/lib/auth.ts.
 */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  /** Avatar initials (used when no avatarUrl) */
  avatar: string;
  avatarUrl?: string | null;
  role: string;
  verificationStatus: string;
  isVerified: boolean;
  emailVerified: boolean;
  bio: string;
  location: string;
  coverGradient: string;
  coverUrl?: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  sportsFollowing: string[];
  roleData: Record<string, unknown>;
  registeredAt: string;
  roleId: string;
  roleTypeId: string;
  // Optional fields from /api/auth/me and /api/profile
  roleName?: string;
  roleSlug?: string;
  roleIcon?: string;
  roleCategory?: string;
  typeName?: string;
  typeSlug?: string;
  sports?: Array<{
    id: string;
    name: string;
    slug: string;
    icon?: string;
    category?: string;
    sportType?: string;
    format?: string;
  }>;
  isPro?: boolean;
  proSince?: string | null;
  proTier?: string | null;
  typedProfile?: Record<string, unknown> | null;
  roleProfile?: Record<string, unknown>;
}

export interface AuthSession {
  user: PublicUser;
  token: string;       // JWT (also stored in httpOnly cookie on web)
  expiresAt: number;   // epoch ms
}

export interface LoginRequest {
  email: string;       // accepts email or handle
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  handle: string;
  sports?: string[];
  role?: UserRole;     // ignored on server (always 'fan' on register); kept for type compat
  roleData?: Record<string, unknown>;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
  expiresAt: number;
}

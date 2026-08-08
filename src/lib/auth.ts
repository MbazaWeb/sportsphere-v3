import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';
import { safeJsonParse } from './json';
import { SESSION_COOKIE, verifySession } from './session';

// Re-export everything edge-safe from session.ts so callers have one import.
// `lib/auth.ts` itself is server-only (it pulls in bcryptjs); middleware
// imports `lib/session.ts` directly to stay Edge-compatible.
export {
  signSession,
  verifySession,
  buildSessionCookie,
  buildClearCookie,
  generateResetToken,
  resetTokenExpiry,
  isResetTokenValid,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from './session';
export type { SessionPayload } from './session';

// ─── Convenience: extract user ID from request session cookie ─
// Use this in API routes instead of relying on the proxy x-user-id header.
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  return payload?.sub ?? null;
}

// ─── Password hashing (server-only — uses bcryptjs) ──────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string | null | undefined
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

// ─── Public user serializer ───────────────────────────────────
// Strips sensitive fields (passwordHash, resetToken, resetTokenExpiry)
// and parses JSON-stringified fields back to objects.
export function serializePublicUser(u: {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatarUrl: string | null;
  avatarInitials: string | null;
  role: string;
  verificationStatus: string;
  isVerified: boolean;
  emailVerified: boolean;
  bio: string | null;
  location: string | null;
  coverGradient: string;
  coverUrl: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  sportsFollowing: unknown;
  roleData: unknown;
  registeredAt: Date;
  roleId: string;
  roleTypeId: string;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    handle: u.handle,
    avatar: u.avatarInitials || u.name.slice(0, 2).toUpperCase(),
    avatarUrl: u.avatarUrl || null,
    role: u.role,
    verificationStatus: u.verificationStatus,
    isVerified: u.isVerified,
    emailVerified: u.emailVerified,
    bio: u.bio || '',
    location: u.location || '',
    coverGradient: u.coverGradient,
    coverUrl: u.coverUrl || null,
    followerCount: u.followerCount,
    followingCount: u.followingCount,
    postCount: u.postCount,
    sportsFollowing: safeJsonParse(u.sportsFollowing, []),
    roleData: safeJsonParse(u.roleData, {}),
    registeredAt: u.registeredAt.toISOString(),
    roleId: u.roleId,
    roleTypeId: u.roleTypeId,
  };
}



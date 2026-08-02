import bcrypt from 'bcryptjs';

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
  bio: string | null;
  location: string | null;
  coverGradient: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  sportsFollowing: unknown;
  roleData: unknown;
  registeredAt: Date;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    handle: u.handle,
    avatar: u.avatarInitials || u.name.slice(0, 2).toUpperCase(),
    role: u.role,
    verificationStatus: u.verificationStatus,
    isVerified: u.isVerified,
    bio: u.bio || '',
    location: u.location || '',
    coverGradient: u.coverGradient,
    followerCount: u.followerCount,
    followingCount: u.followingCount,
    postCount: u.postCount,
    sportsFollowing: safeJsonParse(u.sportsFollowing, []),
    roleData: safeJsonParse(u.roleData, {}),
    registeredAt: u.registeredAt.toISOString(),
  };
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T; // Already parsed (PostgreSQL Json)
}

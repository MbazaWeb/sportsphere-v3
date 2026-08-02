import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// ─── Config ────────────────────────────────────────────────────
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'dev-only-insecure-secret-please-set-SESSION_SECRET-in-env-9f2a4c1b';

const SESSION_COOKIE_NAME = 'ss_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

const encoder = new TextEncoder();

// ─── Password hashing ─────────────────────────────────────────
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

// ─── JWT session ──────────────────────────────────────────────
export interface SessionPayload {
  sub: string; // user id
  email: string;
  handle: string;
  role: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(encoder.encode(SESSION_SECRET));
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(SESSION_SECRET), {
      algorithms: ['HS256'],
    });
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      handle: payload.handle as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

// ─── Cookie helpers (server side) ─────────────────────────────
export const SESSION_COOKIE = SESSION_COOKIE_NAME;
export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;

export function buildSessionCookie(token: string): string {
  const flags = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${SESSION_TTL_SECONDS}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  // Secure flag only in production (HTTPS). In local dev over http,
  // a Secure cookie would be rejected by the browser.
  if (process.env.NODE_ENV === 'production') flags.push('Secure');
  return flags.join('; ');
}

export function buildClearCookie(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ].join('; ');
}

// ─── Password reset tokens ────────────────────────────────────
export function generateResetToken(): string {
  // 32 bytes of randomness, hex-encoded → 64 chars
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function resetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MS);
}

export function isResetTokenValid(expiry: Date | null | undefined): boolean {
  if (!expiry) return false;
  return new Date(expiry).getTime() > Date.now();
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
  sportsFollowing: string;
  roleData: string;
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

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

import { SignJWT, jwtVerify } from 'jose';

// ─── Config ────────────────────────────────────────────────────
const SESSION_SECRET = (() => {
  const env = process.env.SESSION_SECRET;
  if (env) return env;
  // In production, a missing SESSION_SECRET is a critical security issue.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET environment variable is required in production. ' +
      'Set it to a cryptographically random string (e.g. `openssl rand -hex 32`).'
    );
  }
  // Dev-only fallback — never used in production.
  console.warn(
    '[SportSphere] WARNING: Using insecure dev SESSION_SECRET. ' +
    'Set SESSION_SECRET in your .env for production.'
  );
  return 'dev-only-insecure-secret-please-set-SESSION_SECRET-in-env-9f2a4c1b';
})();

const SESSION_COOKIE_NAME = 'ss_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

const encoder = new TextEncoder();

// ─── JWT session ──────────────────────────────────────────────
// This file is Edge-safe — it only imports `jose` (which ships an Edge
// build). It must NOT import `bcryptjs` or any Node-only module, because
// it's imported by `src/middleware.ts` which runs in the Edge runtime.
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

// ─── Password reset tokens (crypto.getRandomValues — Edge-safe) ──
export function generateResetToken(): string {
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

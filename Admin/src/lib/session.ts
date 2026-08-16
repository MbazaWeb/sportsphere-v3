import { SignJWT, jwtVerify } from 'jose';

/**
 * Admin session — self-contained.
 *
 * The admin app now talks DIRECTLY to the database. It issues its own JWT
 * (signed with ADMIN_JWT_SECRET) containing the admin user's id, email,
 * handle, and role. The fan web app is no longer involved in admin auth.
 *
 * Cookie name: admin_session
 * Algorithm: HS256
 * TTL: 7 days
 *
 * Why a separate secret from the fan app?
 *   - Defense in depth: a leaked fan-app session secret doesn't grant admin
 *     access, and vice versa.
 *   - The admin JWT carries admin-only claims (role=administrator) that the
 *     fan app's `verifySession` wouldn't trust anyway.
 */

const COOKIE_NAME = 'admin_session';
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

function getSecret(): string {
  const env = process.env.ADMIN_JWT_SECRET;
  if (env && env.length >= 32) return env;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_JWT_SECRET must be set to a >=32-char random string in production. ' +
        'Generate one with: openssl rand -hex 32'
    );
  }
  console.warn(
    '[admin] WARNING: using insecure dev ADMIN_JWT_SECRET. Set ADMIN_JWT_SECRET in .env.'
  );
  return 'dev-only-insecure-admin-jwt-secret-please-set-ADMIN_JWT_SECRET-32+chars';
}

export interface AdminSessionPayload {
  sub: string; // user id
  email: string;
  handle: string;
  role: string;
  name: string;
}

export const ADMIN_COOKIE = COOKIE_NAME;
export const ADMIN_COOKIE_TTL = TTL_SECONDS;

export async function signAdminSession(
  payload: AdminSessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(encoder.encode(getSecret()));
}

export async function verifyAdminSession(
  cookieValue: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!cookieValue) return null;
  try {
    const { payload } = await jwtVerify(
      cookieValue,
      encoder.encode(getSecret()),
      { algorithms: ['HS256'] }
    );
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      handle: payload.handle as string,
      role: payload.role as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export function buildAdminCookie(token: string): string {
  const flags = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${TTL_SECONDS}`,
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
  ];
  return flags.join('; ');
}

export function buildClearAdminCookie(): string {
  return [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ].join('; ');
}

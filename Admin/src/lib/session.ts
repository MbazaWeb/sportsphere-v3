import { SignJWT, jwtVerify } from 'jose';

/**
 * Admin session cookie helpers.
 *
 * The admin app stores the fan app's `ss_session` JWT token inside its own
 * cookie called `admin_session`. The value is a *wrapper* JWT — we sign
 * the inner token with ADMIN_COOKIE_SECRET so that even if the admin app
 * and fan app share a host, an attacker who steals one cookie can't reuse
 * it on the other app without the corresponding secret.
 *
 * Flow:
 *   1. Admin logs in → admin app calls fan app's /api/admin/auth/login
 *   2. Fan app returns Set-Cookie: ss_session=<JWT>
 *   3. Admin app reads that JWT, wraps it: sign({ ss: <JWT> }, ADMIN_SECRET)
 *   4. Admin app sets admin_session=<wrapped JWT> on the response
 *   5. On subsequent admin app API calls, we verify admin_session, extract
 *      the inner ss_session, and forward it to the fan app as a Cookie header
 */

const COOKIE_NAME = 'admin_session';
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days (matches fan app session)

const encoder = new TextEncoder();

function getSecret(): string {
  const env = process.env.ADMIN_COOKIE_SECRET;
  if (env && env.length >= 32) return env;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_COOKIE_SECRET must be set to a >=32-char random string in production. ' +
        'Generate one with: openssl rand -hex 32'
    );
  }
  console.warn(
    '[admin] WARNING: using insecure dev ADMIN_COOKIE_SECRET. Set ADMIN_COOKIE_SECRET in .env.'
  );
  return 'dev-only-insecure-admin-secret-please-set-ADMIN_COOKIE_SECRET-32+chars';
}

export const ADMIN_COOKIE = COOKIE_NAME;
export const ADMIN_COOKIE_TTL = TTL_SECONDS;

export async function signAdminSession(ssToken: string): Promise<string> {
  return new SignJWT({ ss: ssToken })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(encoder.encode(getSecret()));
}

export async function verifyAdminSession(
  cookieValue: string | undefined | null
): Promise<string | null> {
  if (!cookieValue) return null;
  try {
    const { payload } = await jwtVerify(cookieValue, encoder.encode(getSecret()), {
      algorithms: ['HS256'],
    });
    return (payload.ss as string) || null;
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
  ];
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? '';
  if (adminUrl.startsWith('https://')) flags.push('Secure');
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

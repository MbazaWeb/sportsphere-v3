/**
 * proxy.ts  — Next.js 16 edge proxy (replaces middleware.ts)
 *
 * Runs in the Edge runtime. Protects admin/dashboard routes by verifying
 * the ss_session JWT cookie (signed with SESSION_SECRET via @/lib/session).
 *
 * Why proxy.ts and not middleware.ts?
 *   Next.js 16 renamed `middleware` → `proxy`. The file must be named proxy.ts
 *   and export a `proxy` function. middleware.ts is deprecated.
 *   Source: https://next.org/blog/next-16
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

/**
 * Routes that require an authenticated session (any role).
 * The proxy redirects unauthenticated visitors to /login.
 */
const PROTECTED_PREFIXES = [
  '/sportsphere/admin',
  '/sportsphere/dashboard',
  '/sportsphere/profile/edit',
  '/sportsphere/settings',
];

/**
 * Routes that additionally require an ADMIN role.
 * Authenticated non-admin users are sent to /403.
 */
const ADMIN_PREFIXES = ['/sportsphere/admin'];

/** Exact admin role values that are allowed (lowercase, exact match). */
const ADMIN_ROLES = new Set(['admin', 'administrator']);

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // ── Verify the session cookie ────────────────────────────────────────────
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return redirectToLogin(request);
  }

  const payload = await verifySession(sessionCookie);

  if (!payload) {
    // Expired, tampered, or wrong signature — treat as unauthenticated
    return redirectToLogin(request);
  }

  // ── Admin-only routes ────────────────────────────────────────────────────
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAdminRoute) {
    const role = (payload.role ?? '').toLowerCase().trim();
    if (!ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return NextResponse.next();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// Matcher: only run the proxy on the routes that need it.
export const config = {
  matcher: [
    '/sportsphere/admin/:path*',
    '/sportsphere/dashboard/:path*',
    '/sportsphere/profile/edit/:path*',
    '/sportsphere/settings/:path*',
  ],
};

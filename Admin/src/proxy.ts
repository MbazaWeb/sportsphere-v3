import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminSession, ADMIN_COOKIE } from '@/lib/session';

/**
 * Next.js 16 proxy (formerly middleware) — runs on the Edge runtime.
 *
 * Routing rules:
 *   - /login             → public
 *   - /api/auth/*        → public (login/logout/me manage their own auth)
 *   - /api/admin/*       → public (the routes themselves call verifyAdmin)
 *   - everything else    → requires a valid admin_session cookie with an
 *                           admin role claim; otherwise redirect to /login.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/admin/') ||
    pathname === '/api/metrics' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // Protected paths — verify the admin_session JWT
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const payload = await verifyAdminSession(cookie);

  if (!payload?.sub) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fast pre-check: reject non-admins at the edge
  const role = (payload.role || '').toUpperCase();
  const isAdmin =
    role === 'ADMINISTRATOR' ||
    role === 'ADMIN' ||
    role.includes('ADMIN');

  if (!isAdmin) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    loginUrl.searchParams.set('reason', 'forbidden');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

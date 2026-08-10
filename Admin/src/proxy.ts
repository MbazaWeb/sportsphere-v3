import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminSession, ADMIN_COOKIE } from '@/lib/session';

/**
 * Next.js 16 proxy (formerly middleware) — runs on the Edge runtime.
 *
 * Routing rules:
 *   - /login             → public
 *   - /api/auth/*        → public (login, logout, me — they manage their own auth)
 *   - /api/admin/*       → public (the routes themselves check the cookie)
 *   - everything else    → requires a valid admin_session cookie; otherwise
 *                           redirect to /login?next=...
 *
 * The role check still happens inside every /api/admin/* route — the proxy
 * only does a fast "is there a cookie + does it parse" check so we don't
 * render React shells for visitors who definitely aren't allowed.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths
  if (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // Protected paths — require a parseable admin_session cookie
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const ssToken = await verifyAdminSession(cookie);

  if (!ssToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

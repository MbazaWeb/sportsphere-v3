import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

// ─── Next.js 16 proxy (formerly "middleware") ────────────────
// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`.
// The function name also changed from `middleware` to `proxy`.
// Docs: https://nextjs.org/docs/messages/middleware-to-proxy

// Routes that DON'T require a session.
// - /api/auth/* — login, register, forgot/reset password, logout, me
// - Public content routes — guests can browse Home, Scores, and view
//   public profiles without logging in (spec: "Guests can view all
//   scores, fixtures, standings, statistics, lineups, match details").
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/feed',
  '/api/matches',
  '/api/standings',
  '/api/spotlight',
  '/api/communities',
  '/api/users',
  '/api/profile-data',
  '/api/comments',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard API routes. Pages are public (the app handles auth in-UI).
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  // Pass session info to downstream route handlers via request headers.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.sub);
  requestHeaders.set('x-user-email', session.email);
  requestHeaders.set('x-user-handle', session.handle);
  requestHeaders.set('x-user-role', session.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Run on all API routes. Pages bypass proxy entirely (see early return above).
  matcher: ['/api/:path*'],
};

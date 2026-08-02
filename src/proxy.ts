import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

// ─── Next.js 16 proxy (formerly "middleware") ────────────────
// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`.
// The function name also changed from `middleware` to `proxy`.
// Docs: https://nextjs.org/docs/messages/middleware-to-proxy

// Routes that are fully public (any method) — auth flows.
const PUBLIC_AUTH_PREFIXES = ['/api/auth'];

// Routes where GET is public (guests can browse) but POST/PATCH/DELETE
// requires auth. This matches the spec: "Guests can view all scores,
// fixtures, standings, statistics, lineups, match details" but actions
// like posting, commenting, liking, voting require login.
const PUBLIC_GET_PREFIXES = [
  '/api/feed',
  '/api/matches',
  '/api/standings',
  '/api/spotlight',
  '/api/communities',
  '/api/users',
  '/api/profile-data',
  '/api/profile',        // GET profile by handle is public
  '/api/comments',
  '/api/follows',        // GET (list followers/following) is public
  '/api/leaderboard',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Only guard API routes. Pages are public (the app handles auth in-UI).
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Auth routes are always public (login, register, etc.)
  const isAuthRoute = PUBLIC_AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // For public-GET routes, allow GET/HEAD without auth, but require auth
  // for any write method (POST, PUT, PATCH, DELETE).
  const isPublicGetRoute = PUBLIC_GET_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublicGetRoute && (method === 'GET' || method === 'HEAD')) {
    // Even for public GETs, if the user IS logged in, pass their session
    // info through so the route can personalize (e.g. /api/profile without
    // a handle returns the logged-in user's own profile).
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    if (session) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', session.sub);
      requestHeaders.set('x-user-email', session.email);
      requestHeaders.set('x-user-handle', session.handle);
      requestHeaders.set('x-user-role', session.role);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.next();
  }

  // Everything else (including POST to public-GET routes) requires a session.
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

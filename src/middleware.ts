/**
 * middleware.ts — Edge middleware for SportSphere
 *
 * Responsibilities:
 *  1. Strip any client-provided identity headers (x-user-id, x-user-role, etc.)
 *     before they reach API route handlers — prevents auth bypass.
 *  2. Enforce authentication on protected routes before they are reached.
 *
 * Runs on the Edge runtime (no Node.js APIs).
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

// Headers that clients must never be able to spoof
const STRIP_HEADERS = ['x-user-id', 'x-user-role', 'x-admin', 'x-forwarded-user'];

// Routes that require a valid session
const PROTECTED_PREFIXES = [
  '/api/posts',
  '/api/likes',
  '/api/comments',
  '/api/follows',
  '/api/feed',
  '/api/polls',
  '/api/predictions',
  '/api/profile',
  '/api/notifications',
  '/api/uploads',
  '/api/sports/follow',
  '/api/messages',
  '/api/admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Clone headers so we can mutate
  const requestHeaders = new Headers(request.headers);

  // ── 1. Strip spoofable identity headers ─────────────────────
  for (const header of STRIP_HEADERS) {
    requestHeaders.delete(header);
  }

  // ── 2. Auth enforcement on protected routes ──────────────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const payload = await verifySession(token);

    if (!payload) {
      // Return 401 for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      }
      // Redirect UI routes to home
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Pass request through with stripped headers
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    // Apply to all API routes and admin pages; skip static assets and _next internals
    '/api/:path*',
    '/admin/:path*',
  ],
};

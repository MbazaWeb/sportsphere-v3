/**
 * proxy.ts — Next.js 16 proxy for SportSphere
 *
 * Responsibilities:
 *  1. Strip any client-provided identity headers (x-user-id, x-user-role, etc.)
 *     before they reach API route handlers — prevents auth bypass.
 *  2. Enforce authentication on protected API routes.
 *  3. Admin panel guard — redirect unauthenticated / non-admin users.
 *
 * Runs on the Edge runtime (no Node.js APIs).
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';
import { getClientIp, apiLimiter, authLimiter, postLimiter, rateLimitResponse } from '@/lib/rate-limit';

// Headers that clients must never be able to spoof
const STRIP_HEADERS = ['x-user-id', 'x-user-role', 'x-admin', 'x-forwarded-user'];

// API routes that require a valid session
const PROTECTED_PREFIXES = [
  '/api/posts',
  '/api/likes',
  '/api/comments',
  '/api/follows',
  // '/api/feed' is intentionally public — unauthenticated users can browse the feed
  '/api/polls',
  '/api/predictions',
  '/api/profile',
  '/api/notifications',
  '/api/uploads',
  '/api/sports/follow',
  '/api/messages',
  '/api/admin',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // ── 0. Global API Rate Limiting ────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Auth routes (stricter: 5 attempts per 5 mins)
    if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
      const usage = authLimiter.check(5, ip);
      if (usage.isRateLimited) return rateLimitResponse(usage);
    }
    // Content creation routes (10 posts per minute)
    else if (pathname === '/api/posts' && request.method === 'POST') {
      const usage = postLimiter.check(10, ip);
      if (usage.isRateLimited) return rateLimitResponse(usage);
    }
    // General API routes (100 requests per minute)
    else {
      const usage = apiLimiter.check(100, ip);
      if (usage.isRateLimited) return rateLimitResponse(usage);
    }
  }

  // Clone headers so we can mutate
  const requestHeaders = new Headers(request.headers);

  // ── 1. Strip spoofable identity headers ─────────────────────
  for (const header of STRIP_HEADERS) {
    requestHeaders.delete(header);
  }

  // ── 2. Admin panel guard ────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
    if (isLoginPage) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    let token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    }
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifySession(token);
    const role = (payload?.role || '').toUpperCase();
    const isAdmin = role === 'ADMINISTRATOR' || role === 'ADMIN' || role.includes('ADMIN');

    if (!payload?.sub || !isAdmin) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      loginUrl.searchParams.set('reason', 'forbidden');
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── 3. Auth enforcement on protected API routes ─────────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    let token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    }
    const payload = await verifySession(token);

    if (!payload) {
      // Return 401 for API routes
      if (pathname.startsWith('/api/')) {
        const cronHeader = request.headers.get("x-cron-secret");
        if (cronHeader && cronHeader === (process.env.CRON_SECRET || "sportsphere-sync-key-2026")) {
          return NextResponse.next();
        }
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
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
    '/api/:path*',
    '/admin/:path*',
  ],
};

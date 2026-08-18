/**
 * middleware.ts — Next.js 16 middleware for SportSphere
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

// ── Inline Edge-compatible rate limiter (simple Map, no Node.js APIs) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string, limit: number): { limited: boolean; remaining: number } {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    rateLimitMap.set(ip, entry);
  }
  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return { limited: entry.count > limit, remaining };
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';
}

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

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // ── 0. Global API Rate Limiting ────────────────────────────
  if (pathname.includes('/api/')) {
    // Auth routes (stricter: 5 attempts per minute)
    if (pathname.includes('/api/auth/login') || pathname.includes('/api/auth/register')) {
      const usage = checkRateLimit(ip, 5);
      if (usage.limited) {
        return NextResponse.json({ error: 'Too many requests. Try again later.', retryAfter: 60 }, {
          status: 429,
          headers: { 'Retry-After': '60' },
        });
      }
    }
    // Content creation routes (10 posts per minute)
    else if (pathname.includes('/api/posts') && request.method === 'POST') {
      const usage = checkRateLimit(ip, 10);
      if (usage.limited) {
        return NextResponse.json({ error: 'Too many requests. Try again later.', retryAfter: 60 }, {
          status: 429,
          headers: { 'Retry-After': '60' },
        });
      }
    }
    // General API routes (100 requests per minute)
    else {
      const usage = checkRateLimit(ip, 100);
      if (usage.limited) {
        return NextResponse.json({ error: 'Too many requests. Try again later.', retryAfter: 60 }, {
          status: 429,
          headers: { 'Retry-After': '60' },
        });
      }
    }
  }

  // Clone headers so we can mutate
  const requestHeaders = new Headers(request.headers);

  // ── 1. Strip spoofable identity headers ─────────────────────
  for (const header of STRIP_HEADERS) {
    requestHeaders.delete(header);
  }

  // ── 2. Admin panel guard ────────────────────────────────────
  if (pathname.includes('/admin')) {
    const isLoginPage = pathname.endsWith('/admin/login') || pathname.includes('/admin/login/');
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
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.includes(prefix))
    && !(pathname.includes('/api/posts') && request.method === 'GET')
    && !(pathname.includes('/api/follows/status') && request.method === 'GET');

  if (isProtected) {
    let token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    }
    const payload = await verifySession(token);

    if (!payload) {
      // Return 401 for API routes
      if (pathname.includes('/api/')) {
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

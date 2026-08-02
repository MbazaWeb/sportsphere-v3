import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

/**
 * SportSphere Auth Proxy (Next.js 16)
 *
 * Protects API routes that require authentication.
 * Public routes (auth, public pages, static assets) are excluded.
 *
 * Edge-compatible — only imports from `@/lib/session` which uses `jose`.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Skip public routes ──────────────────────────────────────
  // Auth API routes (login, register, forgot/reset password, verify-email)
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Public pages & static assets
  if (
    pathname === '/' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // ─── Protect API routes that require auth ────────────────────
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);

    if (!session?.sub) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Add session info to headers for downstream API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.sub);
    requestHeaders.set('x-user-role', session.role);
    if (session.roleId) requestHeaders.set('x-user-role-id', session.roleId);
    if (session.roleTypeId) requestHeaders.set('x-user-role-type-id', session.roleTypeId);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  // Match all API routes except auth
  matcher: ['/api/:path*'],
};

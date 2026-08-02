import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

// Routes that DON'T require a session. Anything under /api/auth/* is public
// (login, register, forgot-password, reset-password, logout, me).
// Everything else under /api/* is protected.
const PUBLIC_API_ROUTES = new Set<string>([]);
const PUBLIC_API_PREFIXES = ['/api/auth'];

export async function middleware(request: NextRequest) {
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
  // Run on all API routes. Pages bypass middleware entirely (see early return above).
  matcher: ['/api/:path*'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminSession, ADMIN_COOKIE } from '@/lib/session';

export async function proxy(request: NextRequest) {
  let { pathname } = request.nextUrl;

  // Normalize path if basePath prefix is passed directly by proxy
  if (pathname.startsWith('/sportsphere-admin')) {
    pathname = pathname.replace('/sportsphere-admin', '') || '/';
  }

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
    const loginUrl = new URL('/sportsphere-admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fast pre-check: reject non-admins at the edge.
  // CRITICAL: use exact string matching only. The previous role.includes('ADMIN')
  // allowed any role containing the substring "ADMIN" (auth bypass).
  const role = (payload.role || '').toUpperCase();
  const ALLOWED_ADMIN_ROLES = new Set([
    'ADMINISTRATOR',
    'ADMIN',
    'SUPER_ADMIN',
    'PLATFORM_ADMIN',
  ]);
  const isAdmin = ALLOWED_ADMIN_ROLES.has(role);

  if (!isAdmin) {
    const loginUrl = new URL('/sportsphere-admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    loginUrl.searchParams.set('reason', 'forbidden');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
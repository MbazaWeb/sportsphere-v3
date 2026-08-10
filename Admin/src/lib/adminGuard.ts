import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  verifyAdminSession,
  type AdminSessionPayload,
} from './session';

/**
 * Admin guard — used by every /api/admin/* route.
 *
 * Reads the admin_session cookie from the request, verifies the JWT
 * signature, and ensures the role claim is an admin role.
 *
 * Returns:
 *   { authorized: true, user: AdminSessionPayload }  → proceed
 *   { authorized: false, response: NextResponse }    → return this to client
 */
export async function verifyAdmin(request: NextRequest): Promise<
  | { authorized: true; user: AdminSessionPayload }
  | { authorized: false; response: NextResponse }
> {
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const payload = await verifyAdminSession(cookie);

  if (!payload?.sub) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: admin session missing or expired' },
        { status: 401 }
      ),
    };
  }

  const role = (payload.role || '').toUpperCase();
  const isAdmin =
    role === 'ADMINISTRATOR' ||
    role === 'ADMIN' ||
    role.includes('ADMIN');

  if (!isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden: administrator role required' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user: payload };
}

/**
 * Helper to extract the admin_session cookie value from a NextRequest.
 * Used by routes that just need the raw JWT string (rare).
 */
export function getAdminCookieValue(request: NextRequest): string | undefined {
  return request.cookies.get(ADMIN_COOKIE)?.value;
}

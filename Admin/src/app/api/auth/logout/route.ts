import { NextResponse } from 'next/server';
import { buildClearAdminCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 *
 * Clears the admin_session cookie. Since the admin app now owns its own
 * session (no fan-app coordination needed), this is purely a cookie clear.
 *
 * Always returns 200 — idempotent.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', buildClearAdminCookie());
  return response;
}

import { NextResponse } from 'next/server';
import {
  getSsSessionFromRequest,
  logoutViaMainApp,
} from '@/lib/main-app-client';
import { buildClearAdminCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 *
 * Best-effort logout:
 *   1. Forward the logout call to the fan app (invalidates the ss_session
 *      server-side).
 *   2. Clear our own admin_session cookie.
 *
 * Always returns 200 — even if the fan app call fails, the admin is logged
 * out of the console.
 */
export async function POST() {
  const ssToken = await getSsSessionFromRequest();
  if (ssToken) {
    await logoutViaMainApp(ssToken);
  }

  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', buildClearAdminCookie());
  return response;
}

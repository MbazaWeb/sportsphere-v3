import { NextRequest, NextResponse } from 'next/server';
import {
  loginViaMainApp,
} from '@/lib/main-app-client';
import {
  signAdminSession,
  buildAdminCookie,
} from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/login
 *
 * Body: { email?, handle?, password }
 *
 * Forwards credentials to the fan app's /api/admin/auth/login endpoint.
 * If the fan app accepts them, captures the returned ss_session JWT,
 * wraps it in our own admin_session cookie, and returns the admin user
 * profile to the browser.
 *
 * If the fan app rejects the credentials (401) or denies admin access
 * (403), we pass that error through unchanged.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      handle?: string;
      password?: string;
    };

    const result = await loginViaMainApp(body);

    if (!result.ok || !result.ssToken) {
      return NextResponse.json(
        { error: result.error || 'Login failed.' },
        { status: result.status }
      );
    }

    // Wrap the fan-app's ss_session JWT inside our own admin_session cookie.
    const wrapped = await signAdminSession(result.ssToken);

    const response = NextResponse.json({
      ok: true,
      user: result.user,
    });
    response.headers.set('Set-Cookie', buildAdminCookie(wrapped));
    return response;
  } catch (err) {
    console.error('[admin login] error:', err);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  verifyAdminSession,
} from './session';

/**
 * Server-side HTTP client for talking to the fan web app.
 *
 * Every admin app API route is a thin proxy: it reads the caller's
 * admin_session cookie, extracts the inner ss_session JWT, and forwards
 * the request to the fan app's /api/admin/* endpoints with that JWT in
 * a Cookie header. The fan app's `verifyAdminSession()` does the real
 * authorization.
 *
 * Why a server-side proxy instead of calling the fan app from the browser:
 *   - The fan app's session cookie is HttpOnly and scoped to its own
 *     origin/port; the admin app's browser can't read or send it.
 *   - We don't want to expose the fan app's /api/admin/* URLs to the
 *     browser (defense in depth).
 *   - We can inject the cookie server-side without exposing the JWT.
 */

export function mainAppBaseUrl(): string {
  const url = process.env.MAIN_APP_URL;
  if (!url) {
    throw new Error(
      'MAIN_APP_URL is not set. Add it to .env (e.g. http://127.0.0.1:3002/sportsphere)'
    );
  }
  return url.replace(/\/$/, '');
}

/**
 * Extract the fan-app ss_session JWT from the incoming admin_app request's
 * admin_session cookie. Returns null if the cookie is missing or invalid.
 *
 * Used by every /api/admin/* proxy route.
 */
export async function getSsSessionFromRequest(): Promise<string | null> {
  const h = await headers();
  const cookieHeader = h.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...rest] = c.trim().split('=');
      return [k, rest.join('=')];
    })
  );
  return verifyAdminSession(cookies[ADMIN_COOKIE]);
}

interface ProxyOptions {
  method: string;
  path: string; // e.g. '/api/admin/stats' — appended to MAIN_APP_URL
  body?: unknown;
  /** Query string params to add. */
  query?: Record<string, string | undefined>;
  /** Allow the response to pass through even on non-2xx status. */
  passthrough?: boolean;
}

/**
 * Forward an API call to the fan app. If `ssToken` is null, returns a 401
 * NextResponse directly (caller should return this immediately).
 *
 * Returns a NextResponse that the caller can return as-is.
 */
export async function forwardToMainApp(
  ssToken: string | null,
  opts: ProxyOptions
): Promise<NextResponse> {
  if (!ssToken) {
    return NextResponse.json(
      { error: 'Unauthorized: admin session missing or expired' },
      { status: 401 }
    );
  }

  const url = new URL(mainAppBaseUrl() + opts.path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }

  const init: RequestInit = {
    method: opts.method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // Inject the fan-app session cookie. The fan app's adminGuard reads
      // this exact cookie name.
      Cookie: `ss_session=${ssToken}`,
    },
    cache: 'no-store',
  };

  if (opts.body !== undefined && opts.method !== 'GET' && opts.method !== 'HEAD') {
    init.body = JSON.stringify(opts.body);
  }

  try {
    const upstream = await fetch(url.toString(), init);
    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json';

    if (!upstream.ok && !opts.passthrough) {
      // Try to parse JSON error; fall back to raw text.
      let errBody: unknown = { error: text };
      try {
        errBody = JSON.parse(text);
      } catch {
        /* keep raw text error */
      }
      return NextResponse.json(errBody, {
        status: upstream.status,
        headers: { 'content-type': contentType },
      });
    }

    // Pass through the body (JSON or text) with the original status.
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'content-type': contentType },
    });
  } catch (err) {
    console.error(`[admin-proxy] ${opts.method} ${opts.path} failed:`, err);
    return NextResponse.json(
      {
        error: 'Failed to reach the fan web app. It may be down or unreachable.',
      },
      { status: 502 }
    );
  }
}

/**
 * Special-case helper for the login flow. The admin app calls the fan app's
 * /api/admin/auth/login with the user's credentials. The fan app returns a
 * Set-Cookie header containing `ss_session=<JWT>`. We extract that JWT
 * value so the caller can wrap it in our own admin_session cookie.
 *
 * Returns { ok, ssToken?, user?, error?, status }
 */
export async function loginViaMainApp(
  credentials: { email?: string; handle?: string; password?: string }
): Promise<{
  ok: boolean;
  ssToken?: string;
  user?: unknown;
  error?: string;
  status: number;
}> {
  const url = mainAppBaseUrl() + '/api/admin/auth/login';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(credentials),
      cache: 'no-store',
    });

    const setCookie = res.headers.get('set-cookie') || '';
    // The fan app sets `ss_session=<jwt>; Path=/...`. Extract the value.
    const match = setCookie.match(/ss_session=([^;]+)/);
    const ssToken = match ? match[1] : undefined;

    let body: any = null;
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: body?.error || 'Login failed on the fan app.',
      };
    }

    if (!ssToken) {
      return {
        ok: false,
        status: 500,
        error: 'Fan app did not return a session cookie. Check MAIN_APP_URL.',
      };
    }

    return {
      ok: true,
      status: 200,
      ssToken,
      user: body?.user,
    };
  } catch (err) {
    console.error('[admin-login] failed:', err);
    return {
      ok: false,
      status: 502,
      error: 'Failed to reach the fan web app for login.',
    };
  }
}

/**
 * Tell the fan app to invalidate the session, then we clear our own cookie.
 * Best-effort — even if the fan app call fails, we still clear the local
 * cookie so the admin is logged out of the console.
 */
export async function logoutViaMainApp(ssToken: string): Promise<void> {
  try {
    await fetch(mainAppBaseUrl() + '/api/admin/auth/logout', {
      method: 'POST',
      headers: {
        Cookie: `ss_session=${ssToken}`,
      },
      cache: 'no-store',
    });
  } catch (err) {
    console.warn('[admin-logout] fan-app logout failed (continuing anyway):', err);
  }
}

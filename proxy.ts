/**
 * proxy.ts  — Next.js 16 edge proxy (replaces middleware.ts)
 *
 * FIXES APPLIED:
 *  - Renamed exported function from `middleware` → `proxy` (Next.js 16 requirement)
 *  - Admin UI routes are now protected at the edge; unauthenticated requests
 *    are redirected to /login before the page even renders.
 *
 * NOTE: The audit incorrectly suggested renaming this file to middleware.ts.
 * In Next.js 16, proxy.ts IS the correct convention. middleware.ts is deprecated.
 * Source: https://nextjs.org/blog/next-16
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-in-production"
);

/**
 * Routes that require an authenticated session (any role).
 * The proxy redirects unauthenticated visitors to /login.
 */
const PROTECTED_PREFIXES = [
  "/sportsphere/admin",
  "/sportsphere/dashboard",
  "/sportsphere/profile/edit",
  "/sportsphere/settings",
];

/**
 * Routes that additionally require an ADMIN role.
 * Authenticated non-admin users are sent to /403.
 */
const ADMIN_PREFIXES = ["/sportsphere/admin"];

/** Exact admin role values that are allowed (lowercase, exact match). */
const ADMIN_ROLES = ["admin", "administrator"];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // ── Try to verify the session cookie ───────────────────────────────────────
  const sessionCookie = request.cookies.get("session")?.value;

  if (!sessionCookie) {
    return redirectToLogin(request);
  }

  let payload: { role?: string; userId?: string } = {};
  try {
    const { payload: verified } = await jwtVerify(sessionCookie, JWT_SECRET);
    payload = verified as typeof payload;
  } catch {
    // Expired or tampered token — treat as unauthenticated
    return redirectToLogin(request);
  }

  // ── Admin-only routes ───────────────────────────────────────────────────────
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAdminRoute) {
    const role = (payload.role ?? "").toLowerCase().trim();
    if (!ADMIN_ROLES.includes(role)) {
      // Authenticated but not admin → 403 page
      return NextResponse.redirect(new URL("/403", request.url));
    }
  }

  return NextResponse.next();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// Matcher: only run the proxy on the routes that need it.
// Static assets, API routes, and public pages bypass this entirely.
export const config = {
  matcher: [
    "/sportsphere/admin/:path*",
    "/sportsphere/dashboard/:path*",
    "/sportsphere/profile/edit/:path*",
    "/sportsphere/settings/:path*",
  ],
};

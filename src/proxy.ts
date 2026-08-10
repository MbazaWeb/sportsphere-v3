import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/session";

const STRIP_HEADERS = ['x-user-id', 'x-user-role', 'x-admin', 'x-forwarded-user'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  for (const header of STRIP_HEADERS) {
    requestHeaders.delete(header);
  }

  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
    if (isLoginPage) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const sessionCookie = request.cookies.get("ss_session");
    const token = sessionCookie?.value;

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifySession(token);
    const role = (payload?.role || "").toUpperCase();
    const isAdmin = role === "ADMINISTRATOR" || role === "ADMIN" || role.includes("ADMIN");

    if (!payload?.sub || !isAdmin) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      loginUrl.searchParams.set("reason", "forbidden");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};

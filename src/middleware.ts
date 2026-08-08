import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /sportsphere/admin routes
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("ss_session");
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("reason", "session_expired");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes — redirect to home if no session
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("ss_session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

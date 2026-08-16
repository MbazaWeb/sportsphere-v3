import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

/**
 * Allowed admin role values (case-insensitive).
 * Using exact match prevents unintended matches like
 * "administrative-assistant".
 */
const ADMIN_ROLES = new Set(["administrator", "admin"]);

export async function verifyAdminSession(request: NextRequest) {
  const sessionCookie = request.cookies.get("ss_session");
  
  if (!sessionCookie || !sessionCookie.value) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: "Unauthorized: Missing session cookie" }, { status: 401 }) 
    };
  }

  const payload = await verifySession(sessionCookie.value);

  if (!payload || !payload.sub) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: "Unauthorized: Invalid or expired session token" }, { status: 401 }) 
    };
  }

  // FIX: Exact match only — no more .includes("ADMIN")
  const role = (payload.role ?? "").toLowerCase().trim();
  if (!ADMIN_ROLES.has(role)) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: "Forbidden: Administrator role required" }, { status: 403 }) 
    };
  }

  return { authorized: true, user: payload };
}

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

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

  const role = payload.role?.toUpperCase() || "";
  const isTargetAdmin = 
    role === "ADMINISTRATOR" || 
    role === "ADMIN" || 
    role.includes("ADMIN");

  if (!isTargetAdmin) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: "Forbidden: Administrator role required" }, { status: 403 }) 
    };
  }

  return { authorized: true, user: payload };
}

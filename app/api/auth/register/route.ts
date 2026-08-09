/**
 * app/api/auth/register/route.ts
 *
 * FIXES APPLIED:
 *   - Rate limiting: max 5 registrations per IP per hour (Fix #3)
 *
 * Copy the rate-limit block into your existing register handler.
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // ── ADD: Rate limiting (stricter for registration) ──────────────────────
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { success, resetAt } = rateLimit(ip, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  });

  if (!success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      }
    );
  }
  // ── END rate limiting ───────────────────────────────────────────────────

  // … rest of your existing register logic …
}

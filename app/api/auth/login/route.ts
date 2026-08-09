/**
 * app/api/auth/login/route.ts
 *
 * FIXES APPLIED:
 *   - Rate limiting added: max 10 attempts per IP per 15 minutes  (Fix #3)
 *   - Session cookie now uses Secure flag when NODE_ENV=production (Fix #2,#5)
 *
 * ─── HOW TO APPLY ─────────────────────────────────────────────────────────
 * 1. Copy the rate-limit block (lines marked ADD) into your existing
 *    login route handler.
 * 2. Update the cookie() call to include the Secure flag (see bottom).
 *
 * This file shows the complete pattern; adapt field names / DB calls
 * to match your existing implementation.
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/db"; // adjust to your prisma/db import
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-in-production"
);

export async function POST(request: NextRequest) {
  // ── ADD: Rate limiting ──────────────────────────────────────────────────
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { success, remaining, resetAt } = rateLimit(ip, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
  // ── END rate limiting ───────────────────────────────────────────────────

  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  // Always return the same generic message regardless of whether the
  // email exists — prevents user enumeration.
  const GENERIC_ERROR = "Invalid email or password.";

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, passwordHash: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // Issue session JWT (7-day TTL)
  const token = await new SignJWT({ userId: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const response = NextResponse.json({ ok: true });

  // ── ADD: Secure cookie flags ────────────────────────────────────────────
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction, // only sent over HTTPS in production
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
  // ── END cookie ──────────────────────────────────────────────────────────

  return response;
}

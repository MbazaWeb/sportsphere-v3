import { sendPasswordResetEmail } from '@/lib/email';
/**
 * app/api/auth/forgot-password/route.ts
 *
 * FIXES APPLIED:
 *   - Rate limiting: max 5 per IP per 15 minutes            (Fix #3)
 *   - Reset token is hashed with sha-256 before DB storage  (Fix #4)
 *
 * Replace your existing forgot-password POST handler with this pattern.
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { generateResetToken, hashResetToken, safeCompare } from "@/lib/auth-helpers";
import { db } from "@/db"; // adjust to your prisma/db import

// Shared success message — never reveal whether the email exists.
const RESPONSE = {
  message: "If that email is registered, a reset link has been sent.",
};

// ── POST /api/auth/forgot-password ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { success, resetAt } = rateLimit(ip, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const { email } = await request.json();
  if (!email) return NextResponse.json(RESPONSE); // always return same shape

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true },
  });

  if (!user) {
    // Don't reveal non-existence
    return NextResponse.json(RESPONSE);
  }

  // ── Generate token: send raw in email, store hash in DB ─────────────────
  const { rawToken, hashedToken } = generateResetToken();
  const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,       // ← store sha256 hash, NOT rawToken
      resetTokenExpiry: expiry,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${rawToken}`;
  

  await sendPasswordResetEmail(user.email, resetUrl);

  return NextResponse.json(RESPONSE);
}

// ── PUT /api/auth/forgot-password  (consume token + set new password) ───────

export async function PUT(request: NextRequest) {
  const { token, newPassword } = await request.json();

  if (!token || !newPassword) {
    return NextResponse.json(
      { error: "Token and new password are required." },
      { status: 400 }
    );
  }

  // Hash the submitted token and look it up in the DB
  const hashedSubmitted = hashResetToken(token);

  const user = await db.user.findFirst({
    where: {
      resetToken: hashedSubmitted,          // compare hashed ↔ hashed
      resetTokenExpiry: { gt: new Date() }, // not expired
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired reset token." },
      { status: 400 }
    );
  }

  const bcrypt = (await import("bcryptjs")).default;
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,       // single-use: clear after use
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ message: "Password updated successfully." });
}

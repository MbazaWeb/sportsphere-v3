/**
 * lib/auth-helpers.ts
 *
 * Shared auth utilities used across API routes.
 *
 * FIXES APPLIED:
 *   - hashResetToken()     → sha-256 hash before storing in DB      (Fix #4)
 *   - verifyAdminSession() → exact-match role check, not .includes() (Fix #7)
 */

import { createHash, randomBytes } from "crypto";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-in-production"
);

/**
 * Exact role values that grant admin access (lowercase, trimmed).
 * Using an allowlist instead of .includes() prevents "community-admin"
 * or any other role substring accidentally granting full admin access.
 */
const ADMIN_ROLES = new Set(["admin", "administrator"]);

// ────────────────────────────────────────────────────────────────────────────
// Reset Token Helpers  (Fix #4 — hash before storing)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically-random reset token.
 *
 * @returns An object containing:
 *   - `rawToken`    — send this in the reset email URL (never stored)
 *   - `hashedToken` — store this in the DB (sha-256 hex digest)
 *
 * Usage in forgot-password route:
 *
 *   const { rawToken, hashedToken } = generateResetToken();
 *   await db.user.update({ where: { email }, data: { resetToken: hashedToken, resetTokenExpiry: expiryDate } });
 *   await sendEmail(user.email, buildResetUrl(rawToken));
 */
export function generateResetToken(): {
  rawToken: string;
  hashedToken: string;
} {
  const rawToken = randomBytes(32).toString("hex"); // 64-char hex
  const hashedToken = hashResetToken(rawToken);
  return { rawToken, hashedToken };
}

/**
 * Hash a raw reset token with sha-256.
 * Call this when comparing a submitted token against the stored value:
 *
 *   const storedHash = user.resetToken;
 *   const submittedHash = hashResetToken(req.query.token);
 *   const valid = timingSafeEqual(storedHash, submittedHash);
 */
export function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Timing-safe comparison of two strings (prevents timing attacks on token
 * comparisons even though sha-256 hashes aren't secret).
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // crypto.timingSafeEqual requires same-length buffers
  return require("crypto").timingSafeEqual(bufA, bufB);
}

// ────────────────────────────────────────────────────────────────────────────
// Admin Session Verification  (Fix #7 — exact role match)
// ────────────────────────────────────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  role: string;
  email?: string;
}

/**
 * Verify the session cookie and confirm the user has an admin role.
 *
 * Returns the decoded payload on success, or throws an error that the
 * caller should convert into a 401/403 response.
 *
 * Replace the previous `role.includes("ADMIN")` check:
 *
 *   // OLD (fragile — "community-admin" would match):
 *   if (!role.includes("ADMIN")) throw new Error("Forbidden");
 *
 *   // NEW (exact allowlist):
 *   const payload = await verifyAdminSession();
 */
export async function verifyAdminSession(): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    throw new Error("Unauthenticated");
  }

  let payload: SessionPayload;
  try {
    const { payload: verified } = await jwtVerify(token, JWT_SECRET);
    payload = verified as SessionPayload;
  } catch {
    throw new Error("Invalid or expired session");
  }

  const role = (payload.role ?? "").toLowerCase().trim();
  if (!ADMIN_ROLES.has(role)) {
    throw new Error("Forbidden: admin role required");
  }

  return payload;
}

/**
 * Verify any authenticated session (non-admin routes).
 */
export async function verifySession(): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) throw new Error("Unauthenticated");

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionPayload;
  } catch {
    throw new Error("Invalid or expired session");
  }
}

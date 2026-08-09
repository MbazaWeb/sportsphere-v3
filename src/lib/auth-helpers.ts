/**
 * lib/auth-helpers.ts
 *
 * Reset token helpers only. The session verification functions that used to
 * live here (verifyAdminSession, verifySession) were dead code — the admin
 * routes use @/lib/adminGuard which uses the canonical session system
 * (@/lib/session → ss_session cookie + SESSION_SECRET).
 *
 * FIXES APPLIED:
 *   - hashResetToken() → sha-256 hash before storing in DB      (Fix #4)
 *   - Removed dead verifyAdminSession/verifySession that used the wrong
 *     JWT_SECRET + 'session' cookie (canonical system uses SESSION_SECRET
 *     + 'ss_session' cookie via @/lib/session).
 */

import { createHash, randomBytes } from 'crypto';

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
  const rawToken = randomBytes(32).toString('hex'); // 64-char hex
  const hashedToken = hashResetToken(rawToken);
  return { rawToken, hashedToken };
}

/**
 * Hash a raw reset token with sha-256.
 * Call this when comparing a submitted token against the stored value:
 *
 *   const storedHash = user.resetToken;
 *   const submittedHash = hashResetToken(req.query.token);
 *   const valid = safeCompare(storedHash, submittedHash);
 */
export function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
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
  return require('crypto').timingSafeEqual(bufA, bufB);
}

/**
 * src/lib/email.ts
 *
 * Email sending via Resend.
 * Server-only — never import this in client components or edge runtime.
 *
 * Usage:
 *   import { sendOtpEmail, sendPasswordResetEmail, sendWelcomeEmail } from '@/lib/email';
 *
 * NOTE: The Resend client is initialized lazily (on first use), NOT at module
 * load time. This is critical because `new Resend(undefined)` throws — if we
 * constructed it at the top level, the build would crash during "Collecting
 * page data" for any route that imports this module, before RESEND_API_KEY
 * is ever set in .env.
 */

import type { Resend as ResendType } from 'resend';

let _resend: ResendType | null = null;
let _warnedMissingKey = false;

/**
 * Lazily construct the Resend client. Returns null if RESEND_API_KEY is not
 * configured — callers should check for null and degrade gracefully.
 */
function getResend(): ResendType | null {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!_warnedMissingKey) {
      console.warn(
        '[email] RESEND_API_KEY is not set — email sending is disabled. ' +
          'Set RESEND_API_KEY in .env to enable email verification, password reset, and welcome emails.'
      );
      _warnedMissingKey = true;
    }
    return null;
  }

  // Lazy require so the module doesn't crash at import time if the package
  // isn't installed (e.g. during local type-checking without node_modules).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require('resend') as { Resend: typeof ResendType };
  _resend = new Resend(apiKey);
  return _resend;
}

// The "from" address. While on Resend's free tier / using onboarding@resend.dev
// you can only send to verified addresses. Swap this once you verify a domain:
//   FROM_ADDRESS=SportSphere <noreply@yourdomain.com>
const FROM_ADDRESS =
  process.env.FROM_EMAIL ?? 'SportSphere <onboarding@resend.dev>';

// ─── OTP / Email Verification ─────────────────────────────────────────────

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const resend = getResend();
  if (!resend) return; // email disabled — caller should handle gracefully

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [email],
    subject: 'Your SportSphere verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #444; margin-bottom: 24px;">
          Use the code below to verify your SportSphere account.
          It expires in <strong>15 minutes</strong>.
        </p>
        <div style="
          background: #f4f4f5;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin-bottom: 24px;
        ">
          <span style="
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 12px;
            color: #111;
            font-family: monospace;
          ">${otp}</span>
        </div>
        <p style="color: #888; font-size: 13px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] sendOtpEmail failed:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

// ─── Password Reset ───────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    // Email disabled — log the reset URL so it's visible in server logs
    // (useful for dev/testing when RESEND_API_KEY isn't configured).
    console.warn(`[email] Password reset email skipped (no RESEND_API_KEY). Reset URL: ${resetUrl}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [email],
    subject: 'Reset your SportSphere password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #444; margin-bottom: 24px;">
          Click the button below to set a new password.
          This link expires in <strong>30 minutes</strong>.
        </p>
        <a href="${resetUrl}" style="
          display: inline-block;
          background: #18181b;
          color: #fff;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 600;
          margin-bottom: 24px;
        ">Reset password</a>
        <p style="color: #888; font-size: 13px;">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will not change.
        </p>
        <p style="color: #bbb; font-size: 12px; margin-top: 8px;">
          Or copy this link: ${resetUrl}
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] sendPasswordResetEmail failed:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

// ─── Welcome Email ────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const resend = getResend();
  if (!resend) return; // email disabled — non-fatal

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [email],
    subject: 'Welcome to SportSphere 🏆',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111; margin-bottom: 8px;">Welcome, ${name}!</h2>
        <p style="color: #444;">
          Your SportSphere account is ready. Start building your profile,
          connect with athletes, and track your performance.
        </p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://sportsphere.app'}/sportsphere/home" style="
          display: inline-block;
          background: #18181b;
          color: #fff;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 16px;
        ">Go to SportSphere</a>
      </div>
    `,
  });

  if (error) {
    console.error('[email] sendWelcomeEmail failed:', error);
    // Welcome email failure is non-fatal — log but don't throw
  }
}

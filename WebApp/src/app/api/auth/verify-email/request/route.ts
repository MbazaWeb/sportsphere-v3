// POST /api/auth/verify-email/request — Request an email verification OTP
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession, SESSION_COOKIE } from '@/lib/session';
import { sendOtpEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const OTP_TTL_MS = 1000 * 60 * 15; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 5 OTP requests per IP per 15 minutes
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const { success, resetAt } = rateLimit(ip, {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before requesting another code.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    // Authenticate
    let token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    }
    const session = await verifySession(token);
    if (!session?.sub) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Generate cryptographically-random 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiry = new Date(Date.now() + OTP_TTL_MS);

    await db.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: otp, emailVerifyExpiry: expiry },
    });

    // Send via Resend
    await sendOtpEmail(user.email, otp);

    return NextResponse.json({
      ok: true,
      message: 'Verification code sent to your email.',
    });
  } catch (error) {
    console.error('Verify email request error:', error);
    return NextResponse.json(
      { error: 'Unable to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}

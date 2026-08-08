// POST /api/auth/verify-email/request — Request an email verification OTP
// Generates a 6-digit code, stores it on the user record, and returns success.
// In production, this would send an email. In dev, logs to console.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

function generateOTP(): string {
  const digits = new Uint8Array(6);
  crypto.getRandomValues(digits);
  return Array.from(digits, (b) => (b % 10).toString()).join('');
}

const OTP_TTL_MS = 1000 * 60 * 15; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const token = request.cookies.get(SESSION_COOKIE)?.value;
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

    // Generate OTP
    const otp = generateOTP();
    const expiry = new Date(Date.now() + OTP_TTL_MS);

    await db.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: otp, emailVerifyExpiry: expiry },
    });

    // Dev: log OTP to console. Production: send email.
    if (process.env.NODE_ENV !== 'production') {
      console.log('──────────────────────────────────────────────');
      console.log(`Email verification OTP for ${user.email}`);
      console.log(`   OTP: ${otp}`);
      console.log(`   Expires: ${expiry.toISOString()}`);
      console.log('──────────────────────────────────────────────');
    }

    // In production, you would send an email here:
    // await sendEmail({ to: user.email, subject: 'Verify your email', otp });

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

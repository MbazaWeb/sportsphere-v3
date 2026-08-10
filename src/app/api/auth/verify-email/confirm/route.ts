// POST /api/auth/verify-email/confirm — Confirm email with OTP code
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    if (!session?.sub) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { code } = (await request.json()) as { code?: string };

    if (!code || !/^\d{6}$/.test(String(code).trim())) {
      return NextResponse.json(
        { error: 'A valid 6-digit code is required.' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        emailVerified: true,
        emailVerifyToken: true,
        emailVerifyExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Check OTP
    if (user.emailVerifyToken !== String(code).trim()) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (!user.emailVerifyExpiry || new Date(user.emailVerifyExpiry).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark email as verified and clear the token
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    console.error('Verify email confirm error:', error);
    return NextResponse.json(
      { error: 'Unable to verify email. Please try again.' },
      { status: 500 }
    );
  }
}

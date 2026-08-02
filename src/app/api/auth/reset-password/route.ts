import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  hashPassword,
  isResetTokenValid,
  buildSessionCookie,
  signSession,
  serializePublicUser,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = (await request.json()) as {
      token?: string;
      password?: string;
    };

    if (!token || !String(token).trim()) {
      return NextResponse.json(
        { error: 'Reset token is required.' },
        { status: 400 }
      );
    }
    if (!password || String(password).length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: { resetToken: String(token).trim() },
    });

    if (!user || !isResetTokenValid(user.resetTokenExpiry)) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password and clear the reset token (single-use)
    const passwordHash = await hashPassword(String(password));
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Issue a fresh session so the user is logged in immediately
    const sessionToken = await signSession({
      sub: updated.id,
      email: updated.email,
      handle: updated.handle,
      role: updated.role,
    });

    const response = NextResponse.json(serializePublicUser(updated));
    response.headers.set('Set-Cookie', buildSessionCookie(sessionToken));
    return response;
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Unable to reset password. Please try again.' },
      { status: 500 }
    );
  }
}

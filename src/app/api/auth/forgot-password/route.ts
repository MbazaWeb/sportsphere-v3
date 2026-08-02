import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  generateResetToken,
  resetTokenExpiry,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json(
        { error: 'A valid email is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true },
    });

    // For privacy/security: always return the same success message
    // whether or not the email exists. We only store a token if the
    // user exists; the UI never reveals which case happened.
    if (user) {
      const token = generateResetToken();
      const expiry = resetTokenExpiry();
      await db.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      });

      // ─── Dev / no-email mode: log the token to the server console ──
      // In production, replace this with an actual email send (resend,
      // nodemailer, Postmark, etc.). The reset URL format matches the
      // client-side route `/reset-password?token=…`.
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      console.log('──────────────────────────────────────────────');
      console.log(`🔑 Password reset requested for ${normalizedEmail}`);
      console.log(`   Token: ${token}`);
      console.log(`   Reset URL: ${resetUrl}`);
      console.log(`   Expires: ${expiry.toISOString()}`);
      console.log('──────────────────────────────────────────────');
    }

    return NextResponse.json({
      ok: true,
      message:
        'If an account exists for that email, a reset link has been sent. The link expires in 30 minutes.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Unable to process the request.' },
      { status: 500 }
    );
  }
}

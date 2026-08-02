import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPassword,
  signSession,
  buildSessionCookie,
  serializePublicUser,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    // Same error for "no user" and "wrong password" — don't leak existence.
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Issue JWT session token
    const token = await signSession({
      sub: user.id,
      email: user.email,
      handle: user.handle,
      role: user.role,
    });

    const response = NextResponse.json(serializePublicUser(user));
    response.headers.set('Set-Cookie', buildSessionCookie(token));
    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

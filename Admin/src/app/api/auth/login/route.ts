import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import {
  signAdminSession,
  buildAdminCookie,
} from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/login
 *
 * Body: { email?, handle?, password }
 *
 * Direct database authentication:
 *   1. Look up the user in the users table by email OR handle.
 *   2. Verify the password against passwordHash using bcrypt.
 *   3. Reject if the user's role is not an admin role (403).
 *   4. Issue our own admin_session JWT and set it as a cookie.
 *
 * The fan web app is NOT involved — this is a fully independent auth path.
 * Both apps read the same users table, so an admin who changes their
 * password on the fan app is automatically updated here too.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      handle?: string;
      password?: string;
    };

    const identifier = (body.email || body.handle || '').trim().toLowerCase();
    const password = body.password || '';

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/handle and password are required.' },
        { status: 400 }
      );
    }

    // Allow login by email OR handle (same logic as the fan app)
    const isHandle = !identifier.includes('@') || identifier.startsWith('@');
    const handle = identifier.startsWith('@') ? identifier : `@${identifier}`;

    const user = await db.user.findFirst({
      where: isHandle && !identifier.includes('.')
        ? { handle: { equals: handle, mode: 'insensitive' } }
        : {
            OR: [
              { email: { equals: identifier, mode: 'insensitive' } },
              { handle: { equals: handle, mode: 'insensitive' } },
            ],
          },
      select: {
        id: true,
        name: true,
        email: true,
        handle: true,
        role: true,
        roleId: true,
        roleTypeId: true,
        passwordHash: true,
        avatarUrl: true,
        avatarInitials: true,
        isVerified: true,
        emailVerified: true,
        verificationStatus: true,
      },
    });

    // Same error for "no user" and "bad password" — don't leak which one.
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // ─── Admin-only gate ──────────────────────────────────────
    const roleUpper = (user.role || '').toUpperCase();
    const isAdmin =
      roleUpper === 'ADMINISTRATOR' ||
      roleUpper === 'ADMIN' ||
      roleUpper.includes('ADMIN');

    if (!isAdmin) {
      return NextResponse.json(
        {
          error:
            'Access denied. Your account does not have administrator privileges.',
        },
        { status: 403 }
      );
    }

    // Bump lastSeenAt in the background (non-blocking)
    db.user
      .update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      })
      .catch((err) => console.error('Failed to bump lastSeenAt:', err));

    // Issue our own admin JWT
    const token = await signAdminSession({
      sub: user.id,
      email: user.email,
      handle: user.handle,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        role: user.role,
        avatarUrl: user.avatarUrl,
        avatarInitials: user.avatarInitials,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        verificationStatus: user.verificationStatus,
      },
    });
    response.headers.set('Set-Cookie', buildAdminCookie(token));
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

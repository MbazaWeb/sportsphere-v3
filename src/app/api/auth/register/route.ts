import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  hashPassword,
  signSession,
  buildSessionCookie,
  serializePublicUser,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE_RE = /^@?[a-zA-Z0-9_]{3,30}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      handle,
      password,
      sports = [],
      role = 'fan',
      roleData = {},
    } = body as {
      name?: string;
      email?: string;
      handle?: string;
      password?: string;
      sports?: string[];
      role?: string;
      roleData?: Record<string, string>;
    };

    // ─── Validate ─────────────────────────────────────────────
    const errors: string[] = [];
    if (!name || !String(name).trim()) errors.push('Name is required.');
    if (!email || !EMAIL_RE.test(String(email))) errors.push('A valid email is required.');
    if (!handle || !HANDLE_RE.test(String(handle))) errors.push('Handle must be 3–30 alphanumeric/underscore chars.');
    if (!password || String(password).length < 8) errors.push('Password must be at least 8 characters.');
    if (role && !['fan','team','player','coach','referee','journalist','analyst','creator','scout','stadium','venue','academy','community','organization','business'].includes(role)) {
      errors.push('Invalid role.');
    }
    if (errors.length) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedHandle = String(handle).startsWith('@') ? String(handle) : `@${handle}`;

    // ─── Uniqueness check ────────────────────────────────────
    const existing = await db.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { handle: normalizedHandle }] },
      select: { email: true, handle: true },
    });
    if (existing) {
      if (existing.email === normalizedEmail) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'This handle is already taken.' }, { status: 409 });
    }

    // ─── Create user ─────────────────────────────────────────
    const passwordHash = await hashPassword(String(password));
    const isAdvanced = role !== 'fan';

    const user = await db.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        handle: normalizedHandle,
        passwordHash,
        role: String(role),
        verificationStatus: isAdvanced ? 'pending' : 'none',
        sportsFollowing: JSON.stringify(sports),
        roleData: JSON.stringify(roleData),
      },
    });

    // ─── Issue session ───────────────────────────────────────
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
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

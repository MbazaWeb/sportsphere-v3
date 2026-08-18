import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import {
  signSession,
  buildSessionCookie,
  SESSION_MAX_AGE,
  verifyPassword,
  type SessionPayload,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const { success, resetAt } = rateLimit(ip, {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, handle, password } = body as {
      email?: string; handle?: string; password?: string;
    };
    const identifier = (email ?? handle ?? '').trim();
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/handle and password are required.' },
        { status: 400 },
      );
    }

    const GENERIC_ERROR = 'Invalid email/handle or password.';
    const looksLikeEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier);
    const handleNorm = identifier.replace(/^@+/, '').toLowerCase();

    let q = supabaseAdmin
      .from('ss_user')
      .select('id,name,email,handle,password_hash,role,avatar_url,avatar_initials,is_verified,email_verified,is_active')
      .limit(1);

    q = looksLikeEmail
      ? q.ilike('email', identifier.toLowerCase())
      : q.or(`handle.eq."@${handleNorm}",handle.eq."${handleNorm}",handle.ilike."@${handleNorm}"`);

    const { data: rows, error } = await q;
    if (error) {
      console.error('auth login query', error);
      return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
    }

    const user = rows?.[0];
    if (!user?.password_hash) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const payload: SessionPayload = {
      sub: user.id,
      email: user.email,
      handle: user.handle,
      role: user.role || 'fan',
      roleId: '',
      roleTypeId: '',
    };
    const token = await signSession(payload);
    const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        role: user.role,
        avatarUrl: user.avatar_url,
        avatarInitials: user.avatar_initials,
        isVerified: user.is_verified,
        emailVerified: user.email_verified,
      },
      token,
      expiresAt,
    });
    response.headers.set('Set-Cookie', buildSessionCookie(token));
    return response;
  } catch (error) {
    console.error('auth login error', error);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}

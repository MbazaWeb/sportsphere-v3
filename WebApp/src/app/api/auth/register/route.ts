import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import {
  signSession,
  buildSessionCookie,
  SESSION_MAX_AGE,
  hashPassword,
  type SessionPayload,
} from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const { success, resetAt } = rateLimit(ip, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, email, password, handle } = body as {
      name?: string; email?: string; password?: string; handle?: string;
    };

    if (!name?.trim() || !email?.trim() || !password || !handle?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, handle, and password are required.' },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanHandle = handle.trim().startsWith('@') ? handle.trim().toLowerCase() : `@${handle.trim().toLowerCase()}`;

    const { data: existing } = await supabaseAdmin
      .from('ss_user')
      .select('id,email,handle')
      .or(`email.eq."${cleanEmail}",handle.eq."${cleanHandle}"`)
      .limit(1);

    if (existing && existing.length) {
      return NextResponse.json(
        { error: 'Email or handle is already taken.' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const avatarInitials = name.trim().slice(0, 2).toUpperCase();
    const id = crypto.randomUUID();

    let row: Record<string, unknown> = {
      id,
      name: name.trim(),
      email: cleanEmail,
      handle: cleanHandle,
      password_hash: passwordHash,
      avatar_initials: avatarInitials,
      role: 'fan',
      is_verified: false,
      email_verified: false,
      is_active: true,
    };

    let user: any = null;
    let error: any = null;
    for (let i = 0; i < 10; i++) {
      const res = await supabaseAdmin.from('ss_user').insert(row).select('*').maybeSingle();
      error = res.error;
      user = res.data;
      if (!error) break;
      const m = String(error.message).match(/Could not find the '([^']+)' column/i);
      if (m && row[m[1]] !== undefined) {
        delete row[m[1]];
        continue;
      }
      break;
    }

    if (error || !user) {
      console.error('register insert', error);
      return NextResponse.json({ error: error?.message || 'Registration failed.' }, { status: 500 });
    }
    user = { ...user, name: user.name || name.trim(), email: user.email || cleanEmail, handle: user.handle || cleanHandle };

    const payload: SessionPayload = {
      sub: user.id,
      email: user.email,
      handle: user.handle,
      role: user.role,
      roleId: '',
      roleTypeId: '',
    };
    const token = await signSession(payload);
    const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      role: user.role,
      avatarInitials: user.avatar_initials,
      isVerified: user.is_verified,
      roleName: 'Fan',
      roleSlug: 'fan',
      sports: [],
    };

    const response = NextResponse.json(
      { user: publicUser, token, expiresAt, otpSent: false },
      { status: 201 },
    );
    response.headers.set('Set-Cookie', buildSessionCookie(token));
    return response;
  } catch (error) {
    console.error('register error', error);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import {
  signAdminSession,
  buildAdminCookie,
} from '@/lib/session';

export const dynamic = 'force-dynamic';

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

    const byEmail = identifier.includes('@') && !identifier.startsWith('@');

    let q = supabaseAdmin
      .from('ss_user')
      .select('id,name,email,handle,role,password_hash,avatar_url,avatar_initials,is_verified,email_verified,verification_status')
      .limit(1);

    q = byEmail ? q.ilike('email', identifier) : q.ilike('handle', identifier.startsWith('@') ? identifier : `@${identifier}`);

    const { data: rows, error } = await q;
    if (error) {
      console.error('Admin login query error:', error.message);
      return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
    }

    const row = rows?.[0];
    const hash = row?.password_hash as string | undefined;

    if (!row || !hash) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const roleUpper = String(row.role || '').toUpperCase();
    const isAdmin =
      roleUpper === 'ADMINISTRATOR' ||
      roleUpper === 'ADMIN' ||
      roleUpper === 'SUPER_ADMIN' ||
      roleUpper === 'PLATFORM_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Your account does not have administrator privileges.' },
        { status: 403 }
      );
    }

    void supabaseAdmin
      .from('ss_user')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', row.id);

    const token = await signAdminSession({
      sub: row.id,
      email: row.email,
      handle: row.handle,
      role: row.role,
      name: row.name,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        handle: row.handle,
        role: row.role,
        avatarUrl: row.avatar_url,
        avatarInitials: row.avatar_initials,
        isVerified: row.is_verified,
        emailVerified: row.email_verified,
        verificationStatus: row.verification_status,
      },
    });
    response.headers.set('Set-Cookie', buildAdminCookie(token));
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}

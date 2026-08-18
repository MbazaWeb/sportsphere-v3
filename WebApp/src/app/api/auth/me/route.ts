import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function publicUser(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || row.full_name || '',
    email: row.email || '',
    handle: row.handle || '',
    role: row.role || 'fan',
    avatarUrl: row.avatar_url || row.avatarUrl || null,
    coverUrl: row.cover_url || row.coverUrl || null,
    avatarInitials: row.avatar_initials || (row.name || 'U').slice(0, 2).toUpperCase(),
    isVerified: !!(row.is_verified ?? row.isVerified),
    emailVerified: !!(row.email_verified ?? row.emailVerified),
    bio: row.bio || '',
    location: row.location || '',
    roleName: row.role || 'Fan',
    roleSlug: String(row.role || 'fan').toLowerCase(),
    sports: [],
    roleProfile: {},
  };
}

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    }
    const payload = await verifySession(token);
    if (!payload) return NextResponse.json({ user: null }, { status: 200 });

    const { data: user, error } = await supabaseAdmin
      .from('ss_user')
      .select('*')
      .eq('id', payload.sub)
      .maybeSingle();

    if (error) {
      console.error('auth/me', error);
      return NextResponse.json({
        user: {
          id: payload.sub,
          name: '',
          email: payload.email || '',
          handle: payload.handle || '',
          role: payload.role || 'fan',
          roleName: 'Fan',
          roleSlug: payload.role || 'fan',
          sports: [],
        },
      });
    }
    if (!user) {
      const res = NextResponse.json({ user: null }, { status: 200 });
      res.headers.set('Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
      return res;
    }
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    console.error('auth/me error', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

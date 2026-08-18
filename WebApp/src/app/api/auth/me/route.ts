import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    }
    const payload = await verifySession(token);
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('ss_user')
      .select('id,name,email,handle,role,avatar_url,avatar_initials,is_verified,email_verified,bio,location')
      .eq('id', payload.sub)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!user) {
      const res = NextResponse.json({ user: null }, { status: 200 });
      res.headers.set(
        'Set-Cookie',
        `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
      );
      return res;
    }

    return NextResponse.json({
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
        bio: user.bio,
        location: user.location,
        roleName: 'Fan',
        roleSlug: user.role || 'fan',
        sports: [],
        roleProfile: {},
      },
    });
  } catch (error) {
    console.error('auth/me error', error);
    return NextResponse.json({ error: 'Failed to load session.' }, { status: 500 });
  }
}

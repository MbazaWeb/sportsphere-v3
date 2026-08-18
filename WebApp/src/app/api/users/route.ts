import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import { isAdminRole, publicUserView } from '@/lib/official-account';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    const role = request.nextUrl.searchParams.get('role');
    let query = supabaseAdmin
      .from('ss_user')
      .select('id,name,handle,role,avatar_url,avatar_initials,is_verified,bio')
      .limit(40);
    if (role) query = query.ilike('role', role);
    if (q) query = query.or(`name.ilike."%${q}%",handle.ilike."%${q}%"`);
    const { data, error } = await query;
    if (error && !isMissingTable(error)) console.error('users', error);
    return NextResponse.json(
      (data || []).filter((u) => !isAdminRole(u.role)).map((u) => publicUserView({
        id: u.id,
        name: u.name,
        handle: u.handle,
        role: u.role,
        avatarUrl: u.avatar_url,
        avatarInitials: u.avatar_initials || (u.name || 'U').slice(0, 2).toUpperCase(),
        isVerified: !!u.is_verified,
        bio: u.bio,
      })),
    );
  } catch (e) {
    console.error('users', e);
    return NextResponse.json([]);
  }
}

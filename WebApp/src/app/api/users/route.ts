import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import { isAdminRole, publicUserView } from '@/lib/official-account';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    const handle = request.nextUrl.searchParams.get('handle')?.trim();
    const role = request.nextUrl.searchParams.get('role');
    let query = supabaseAdmin
      .from('ss_user')
      .select('id,name,handle,role,avatar_url,avatar_initials,is_verified,bio')
      .limit(Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '40', 10) || 40)));
    if (role) query = query.ilike('role', role);
    if (handle) {
      const h = handle.startsWith('@') ? handle : `@${handle}`;
      query = query.or(`handle.eq."${h}",handle.ilike."${h}"`);
    }
    if (q) query = query.or(`name.ilike."%${q}%",handle.ilike."%${q}%"`);
    const { data, error } = await query;
    if (error && !isMissingTable(error)) console.error('users', error);
    const users = (data || []).filter((u) => !isAdminRole(u.role)).map((u) => publicUserView({
      id: u.id,
      name: u.name,
      handle: u.handle,
      role: u.role,
      avatarUrl: u.avatar_url,
      avatarInitials: u.avatar_initials || (u.name || 'U').slice(0, 2).toUpperCase(),
      isVerified: !!u.is_verified,
      bio: u.bio,
    }));

    if (!role || role === 'team') {
      const { data: teams } = await supabaseAdmin.from('ss_team').select('id,name,slug,logo_url,city,country').limit(80);
      for (const trow of teams || []) {
        if (users.some((u: any) => u.id === trow.id)) continue;
        users.push({
          id: trow.id,
          name: trow.name,
          handle: '@' + (trow.slug || trow.name).toString().toLowerCase().replace(/\s+/g, ''),
          role: 'team',
          avatarUrl: trow.logo_url,
          avatarInitials: (trow.name || 'T').slice(0, 2).toUpperCase(),
          isVerified: true,
          bio: [trow.city, trow.country].filter(Boolean).join(', '),
        });
      }
    }

    return NextResponse.json(users);
  } catch (e) {
    console.error('users', e);
    return NextResponse.json([]);
  }
}

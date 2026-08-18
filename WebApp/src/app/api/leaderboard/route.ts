import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get('role') || undefined;
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '10', 10)));

    let q = supabaseAdmin
      .from('ss_user')
      .select('id,name,handle,role,avatar_url,avatar_initials,is_verified')
      .limit(limit);

    if (role) q = q.ilike('role', role);

    const { data, error } = await q;
    if (error) {
      if (isMissingTable(error)) return NextResponse.json([]);
      console.error('leaderboard', error);
      return NextResponse.json([]);
    }

    const rows = (data || []).map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      handle: u.handle,
      avatarUrl: u.avatar_url,
      avatarInitials: u.avatar_initials || (u.name || 'U').slice(0, 2).toUpperCase(),
      role: u.role,
      isPro: false,
      isVerified: !!u.is_verified,
      points: 0,
      performanceScore: 0,
      tier: 'Unranked',
    }));

    return NextResponse.json(rows);
  } catch (e) {
    console.error('leaderboard', e);
    return NextResponse.json([]);
  }
}

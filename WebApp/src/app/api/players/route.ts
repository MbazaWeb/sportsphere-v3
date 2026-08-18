import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '20', 10) || 20, 1), 50);
    let query = supabaseAdmin
      .from('ss_user')
      .select('id,name,handle,role,avatar_url,avatar_initials,is_verified,bio')
      .ilike('role', 'player')
      .limit(limit);
    if (q) query = query.or(`name.ilike."%${q}%",handle.ilike."%${q}%"`);
    const { data, error } = await query;
    if (error && !isMissingTable(error)) console.error('players', error);
    return NextResponse.json((data || []).map((u) => ({
      id: u.id, name: u.name, handle: u.handle, role: u.role,
      avatarUrl: u.avatar_url, avatarInitials: u.avatar_initials || (u.name || 'P').slice(0, 2).toUpperCase(),
      isVerified: !!u.is_verified, bio: u.bio,
    })));
  } catch (e) {
    console.error('players', e);
    return NextResponse.json([]);
  }
}

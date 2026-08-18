import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    let query = supabaseAdmin.from('ss_player').select('id,name,slug,position,photo_url,team_id').limit(30);
    if (q) query = query.ilike('name', `%${q}%`);
    const { data, error } = await query;
    if (error && isMissingTable(error)) {
      const users = await supabaseAdmin.from('ss_user').select('id,name,handle,avatar_url').ilike('role', 'player').limit(30);
      return NextResponse.json(users.data || []);
    }
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

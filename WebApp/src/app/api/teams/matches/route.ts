import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const teamId = request.nextUrl.searchParams.get('teamId');
    let q = supabaseAdmin.from('ss_match').select('*').order('kickoff', { ascending: false }).limit(40);
    if (teamId) q = q.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
    const { data, error } = await q;
    if (error && isMissingTable(error)) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

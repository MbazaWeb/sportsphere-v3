import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const league = request.nextUrl.searchParams.get('league');
    const status = request.nextUrl.searchParams.get('status');
    let q = supabaseAdmin
      .from('ss_match')
      .select('id,league_id,home_team_id,away_team_id,home_score,away_score,status,kickoff,venue')
      .order('kickoff', { ascending: false })
      .limit(80);
    if (status) q = q.eq('status', status);
    if (league) q = q.eq('league_id', league);
    const { data, error } = await q;
    if (error) {
      if (isMissingTable(error)) return NextResponse.json([]);
      console.error('matches', error);
      return NextResponse.json([]);
    }
    const teamIds = [...new Set((data || []).flatMap((m) => [m.home_team_id, m.away_team_id]).filter(Boolean))];
    const teams: Record<string, any> = {};
    if (teamIds.length) {
      const { data: t } = await supabaseAdmin.from('ss_team').select('id,name,logo_url,short_name').in('id', teamIds);
      for (const row of t || []) teams[row.id] = row;
    }
    return NextResponse.json((data || []).map((m) => {
      const home = teams[m.home_team_id] || {};
      const away = teams[m.away_team_id] || {};
      return {
        id: m.id,
        status: m.status,
        kickoff: m.kickoff,
        venue: m.venue,
        homeTeam: home.name || 'Home',
        awayTeam: away.name || 'Away',
        homeBadge: home.logo_url,
        awayBadge: away.logo_url,
        homeScore: m.home_score,
        awayScore: m.away_score,
      };
    }));
  } catch (e) {
    console.error('matches', e);
    return NextResponse.json([]);
  }
}

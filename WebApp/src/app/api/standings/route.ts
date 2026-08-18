import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type TeamRow = {
  id: string;
  name: string;
  slug?: string;
  city?: string | null;
  logo_url?: string | null;
  league_id?: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const leagueParam = request.nextUrl.searchParams.get('league')
      || request.nextUrl.searchParams.get('id')
      || '';

    let league: any = null;
    if (leagueParam) {
      const { data } = await supabaseAdmin
        .from('ss_league')
        .select('id,name,slug,type,country,season,is_active')
        .or(`name.ilike."${leagueParam}",slug.eq."${leagueParam}"`)
        .limit(1);
      league = data?.[0] || null;
      if (!league) {
        const { data: loose } = await supabaseAdmin
          .from('ss_league')
          .select('id,name,slug,type,country,season,is_active')
          .ilike('name', `%${leagueParam}%`)
          .limit(1);
        league = loose?.[0] || null;
      }
    } else {
      const { data } = await supabaseAdmin
        .from('ss_league')
        .select('id,name,slug,type,country,season,is_active')
        .eq('is_active', true)
        .limit(1);
      league = data?.[0] || null;
    }

    const { data: leagueNames } = await supabaseAdmin
      .from('ss_league')
      .select('name')
      .eq('is_active', true)
      .order('name');
    const available = (leagueNames || []).map((l) => l.name);

    if (!league) {
      return NextResponse.json({
        league: leagueParam || 'None',
        standings: [],
        available,
        message: 'League not found.',
      });
    }

    const { data: teams } = await supabaseAdmin
      .from('ss_team')
      .select('id,name,slug,city,logo_url,league_id')
      .eq('league_id', league.id)
      .limit(200);

    const teamList: TeamRow[] = teams || [];

    const { data: matches } = await supabaseAdmin
      .from('ss_match')
      .select('home_team_id,away_team_id,home_score,away_score,status')
      .eq('league_id', league.id)
      .in('status', ['ft', 'finished', 'FT', 'FINISHED'])
      .limit(2000);

    const stats = new Map<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }>();
    for (const t of teamList) {
      stats.set(t.id, { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 });
    }

    for (const m of matches || []) {
      const home = stats.get(m.home_team_id);
      const away = stats.get(m.away_team_id);
      const hs = Number(m.home_score ?? 0);
      const as = Number(m.away_score ?? 0);
      if (home) {
        home.played++; home.gf += hs; home.ga += as;
        if (hs > as) { home.won++; home.pts += 3; }
        else if (hs === as) { home.drawn++; home.pts += 1; }
        else home.lost++;
      }
      if (away) {
        away.played++; away.gf += as; away.ga += hs;
        if (as > hs) { away.won++; away.pts += 3; }
        else if (as === hs) { away.drawn++; away.pts += 1; }
        else away.lost++;
      }
    }

    const standings = teamList
      .map((t) => {
        const s = stats.get(t.id)!;
        const gd = s.gf - s.ga;
        return {
          pos: 0,
          team: t.name,
          badge: t.logo_url || undefined,
          slug: t.slug,
          city: t.city,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          gf: s.gf,
          ga: s.ga,
          gd,
          pts: s.pts,
        };
      })
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .map((row, i) => ({ ...row, pos: i + 1 }));

    return NextResponse.json({
      league: league.name,
      leagueId: league.id,
      leagueSlug: league.slug,
      type: league.type,
      country: league.country,
      season: league.season,
      standings,
      available,
      source: 'supabase',
    });
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json({
      league: request.nextUrl.searchParams.get('league') || 'None',
      standings: [],
      available: [],
      error: 'Failed to fetch standings.',
    });
  }
}

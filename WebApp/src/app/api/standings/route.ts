// GET /api/standings — Return standings computed from MatchProfile results (admin data)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { batchResolveLogosFromAPI } from '@/lib/team-logo-resolver';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const leagueParam = searchParams.get('league') || searchParams.get('id') || '';

    // Find the league — try by name first (fan app sends names), then by slug
    let league = null;
    if (leagueParam) {
      // Try exact name match first (case-insensitive)
      league = await db.league.findFirst({
        where: { name: { equals: leagueParam, mode: 'insensitive' } },
        include: { Sport: { select: { name: true, slug: true, icon: true } } },
      });
      // Fallback: try by slug
      if (!league) {
        league = await db.league.findUnique({
          where: { slug: leagueParam },
          include: { Sport: { select: { name: true, slug: true, icon: true } } },
        });
      }
      // Fallback: partial name match (contains)
      if (!league) {
        league = await db.league.findFirst({
          where: { name: { contains: leagueParam, mode: 'insensitive' } },
          include: { Sport: { select: { name: true, slug: true, icon: true } } },
        });
      }
    } else {
      // No league specified — pick the first active league
      league = await db.league.findFirst({
        where: { isActive: true, type: 'league' },
        orderBy: { name: 'asc' },
        include: { Sport: { select: { name: true, slug: true, icon: true } } },
      });
    }

    if (!league) {
      return NextResponse.json({
        league: leagueParam || 'None',
        standings: [],
        available: await getAvailableLeagues(),
        message: 'League not found in database.',
      });
    }

    // Get all teams in this league
    const teams = await db.team.findMany({
      where: { leagueId: league.id, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, shortName: true, city: true, country: true, venue: true, logoUrl: true },
    });

    // Build a map: teamId → team info
    const teamMap = new Map<string, typeof teams[0]>();
    for (const t of teams) teamMap.set(t.id, t);

    // Fetch ALL finished matches (ft) for this league from MatchProfile (admin data)
    const finishedMatches = await db.matchProfile.findMany({
      where: { leagueId: league.id, status: 'ft', homeScore: { not: null }, awayScore: { not: null } },
      select: {
        homeTeamId: true, awayTeamId: true,
        homeTeamName: true, awayTeamName: true,
        homeScore: true, awayScore: true,
      },
    });

    // Initialize standings map
    const stats = new Map<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }>();
    for (const t of teams) {
      stats.set(t.id, { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 });
    }

    // Also track by name for matches without team FKs
    const statsByName = new Map<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }>();

    // Aggregate results
    for (const m of finishedMatches) {
      const hs = m.homeScore ?? 0;
      const as = m.awayScore ?? 0;

      // Try by FK first
      if (m.homeTeamId && m.awayTeamId) {
        const home = stats.get(m.homeTeamId);
        const away = stats.get(m.awayTeamId);
        if (home && away) {
          home.played++; away.played++;
          home.gf += hs; home.ga += as;
          away.gf += as; away.ga += hs;
          if (hs > as) { home.won++; home.pts += 3; away.lost++; }
          else if (hs < as) { away.won++; away.pts += 3; home.lost++; }
          else { home.drawn++; away.drawn++; home.pts++; away.pts++; }
          continue;
        }
      }

      // Fallback: match by name
      const hn = m.homeTeamName.toLowerCase().trim();
      const an = m.awayTeamName.toLowerCase().trim();

      // Try to find team by name in teamMap
      let homeTeamId: string | null = null;
      let awayTeamId: string | null = null;
      for (const [id, t] of teamMap) {
        if (t.name.toLowerCase() === hn || t.shortName?.toLowerCase() === hn) homeTeamId = id;
        if (t.name.toLowerCase() === an || t.shortName?.toLowerCase() === an) awayTeamId = id;
      }

      if (homeTeamId && awayTeamId) {
        const home = stats.get(homeTeamId)!;
        const away = stats.get(awayTeamId)!;
        home.played++; away.played++;
        home.gf += hs; home.ga += as;
        away.gf += as; away.ga += hs;
        if (hs > as) { home.won++; home.pts += 3; away.lost++; }
        else if (hs < as) { away.won++; away.pts += 3; home.lost++; }
        else { home.drawn++; away.drawn++; home.pts++; away.pts++; }
      } else {
        // Track by name for teams not in our team table
        for (const [name, s] of [[hn, null], [an, null]] as any[]) {
          // no-op — skip unlinked teams for now
        }
      }
    }

    // Build standings sorted by points (desc), then GD (desc), then GF (desc)
    const standings = teams
      .map((t) => {
        const s = stats.get(t.id)!;
        const gd = s.gf - s.ga;
        return {
          pos: 0,
          team: t.name,
          badge: t.logoUrl || undefined,
          _id: t.id,
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

    // Resolve any missing badges from TheSportsDB
    const teamsMissingBadge = standings.filter(s => !s.badge);
    if (teamsMissingBadge.length > 0) {
      try {
        const apiLogos = await batchResolveLogosFromAPI(teamsMissingBadge.map(s => s.team));
        if (apiLogos.size > 0) {
          for (const row of standings) {
            if (!row.badge) {
              const logo = apiLogos.get(row.team.toLowerCase());
              if (logo) row.badge = logo;
            }
          }
          // Persist discovered logos
          for (const [name, url] of apiLogos) {
            try {
              const team = teams.find(t => t.name.toLowerCase() === name);
              if (team && !team.logoUrl) {
                await db.team.update({ where: { id: team.id }, data: { logoUrl: url } });
              }
            } catch { /* ignore */ }
          }
        }
      } catch (e) {
        console.warn('[standings] Logo resolution failed:', e);
      }
    }

    // Strip internal _id before sending response
    const responseStandings = standings.map(({ _id, ...rest }: any) => rest);

    return NextResponse.json({
      league: league.name,
      leagueId: league.id,
      leagueSlug: league.slug,
      type: league.type,
      country: league.country,
      sport: league.Sport,
      season: league.season,
      standings: responseStandings,
      available: await getAvailableLeagues(),
      source: 'database',
    });
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch standings.' }, { status: 500 });
  }
}

async function getAvailableLeagues(): Promise<string[]> {
  const leagues = await db.league.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { name: true },
  });
  return leagues.map((l) => l.name);
}

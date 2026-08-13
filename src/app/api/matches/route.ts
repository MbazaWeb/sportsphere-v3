import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── Map MatchProfile (admin source-of-truth) to fan API shape ───────────
function mapProfileMatch(m: any) {
  const meta = (m.metadata && typeof m.metadata === 'object') ? m.metadata : {};
  return {
    id: m.id,
    league: m.League?.name || meta.leagueName || 'Friendly',
    leagueId: m.leagueId || '',
    homeTeam: m.homeTeamName,
    awayTeam: m.awayTeamName,
    homeBadge: m.Team_MatchProfile_homeTeamIdToTeam?.logoUrl || meta.homeLogo || undefined,
    awayBadge: m.Team_MatchProfile_awayTeamIdToTeam?.logoUrl || meta.awayLogo || undefined,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    minute: m.minute,
    kickoffAt: m.kickoffAt instanceof Date ? m.kickoffAt.toISOString() : new Date(m.kickoffAt).toISOString(),
    venue: m.venue || undefined,
    continent: m.Sport?.name || meta.continent || '',
    country: m.League?.country || meta.country || '',
    events: Array.isArray(m.events) ? m.events : [],
    source: 'admin',
    // Extra rich data from admin
    sport: m.Sport?.name || undefined,
    period: m.period || undefined,
    metadata: meta,
  };
}

async function loadAdminMatches(status: string, leagueName?: string | null, dateStr?: string | null) {
  try {
    const where: any = { source: 'admin' };
    const now = new Date();

    // Parse date parameter into start/end of day (UTC-aware)
    let dateStart: Date | null = null;
    let dateEnd: Date | null = null;
    if (dateStr) {
      dateStart = new Date(dateStr + 'T00:00:00');
      dateEnd = new Date(dateStr + 'T23:59:59.999');
    }

    if (status === 'live') {
      where.status = { in: ['live', 'ht'] };
    } else if (status === 'upcoming') {
      where.status = 'upcoming';
      if (dateStart && dateEnd) {
        // When a specific date is selected, show upcoming matches on THAT date
        where.kickoffAt = { gte: dateStart, lte: dateEnd };
      } else {
        // Default: show all future upcoming matches
        where.kickoffAt = { gte: now };
      }
    } else if (status === 'results') {
      where.status = 'ft';
      if (dateStart && dateEnd) {
        // When a specific date is selected, show results for THAT date only
        where.kickoffAt = { gte: dateStart, lte: dateEnd };
      }
      // else: show all results (most recent first, limited by take)
    } else if (status === 'today') {
      if (dateStart && dateEnd) {
        where.kickoffAt = { gte: dateStart, lte: dateEnd };
      } else {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        where.kickoffAt = { gte: start, lte: end };
      }
    }

    // Filter by league name or ID
    if (leagueName && leagueName !== 'All') {
      const lower = leagueName.toLowerCase();
      // Try to find the league by name first for exact FK match
      const leagueRecord = await db.league.findFirst({
        where: { name: { contains: leagueName, mode: 'insensitive' } },
        select: { id: true },
      });
      if (leagueRecord) {
        where.leagueId = leagueRecord.id;
      } else {
        // Fallback: no FK match, will post-filter
      }
    }

    const rows = await db.matchProfile.findMany({
      where,
      orderBy: { kickoffAt: status === 'results' ? 'desc' : 'asc' },
      take: dateStr ? 200 : 100,
      include: {
        League: { select: { id: true, name: true, country: true } },
        Sport: { select: { id: true, name: true, icon: true } },
        Team_MatchProfile_homeTeamIdToTeam: { select: { id: true, name: true, logoUrl: true } },
        Team_MatchProfile_awayTeamIdToTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    let results = rows.map(mapProfileMatch);

    // Post-filter by league name if we couldn't do FK match
    if (leagueName && leagueName !== 'All' && !where.leagueId) {
      const lower = leagueName.toLowerCase();
      results = results.filter((m: any) => m.league.toLowerCase().includes(lower));
    }

    return results;
  } catch (e) {
    console.warn('MatchProfile load failed:', e);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') || 'live';
    const leagueName = searchParams.get('league');
    const dateStr = searchParams.get('date') || undefined;

    // Primary: fetch from MatchProfile (admin-created data)
    let matches = await loadAdminMatches(status, leagueName, dateStr);

    // Fallback: if no admin data, try the legacy Match table
    if (!matches || matches.length === 0) {
      try {
        const where: any = {};
        const now = new Date();
        let legacyDateStart: Date | null = null;
        let legacyDateEnd: Date | null = null;
        if (dateStr) {
          legacyDateStart = new Date(dateStr + 'T00:00:00');
          legacyDateEnd = new Date(dateStr + 'T23:59:59.999');
        }
        if (status === 'live') {
          where.status = { in: ['live', 'ht'] };
        } else if (status === 'upcoming') {
          where.status = 'upcoming';
          if (legacyDateStart && legacyDateEnd) {
            where.kickoffAt = { gte: legacyDateStart, lte: legacyDateEnd };
          } else {
            where.kickoffAt = { gte: now };
          }
        } else if (status === 'results') {
          where.status = 'ft';
          if (legacyDateStart && legacyDateEnd) {
            where.kickoffAt = { gte: legacyDateStart, lte: legacyDateEnd };
          }
        } else if (status === 'today') {
          if (legacyDateStart && legacyDateEnd) {
            where.kickoffAt = { gte: legacyDateStart, lte: legacyDateEnd };
          } else {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            where.kickoffAt = { gte: start, lte: end };
          }
        }

        const legacyRows = await db.match.findMany({
          where,
          orderBy: { kickoffAt: status === 'results' ? 'desc' : 'asc' },
          take: 50,
        });

        matches = legacyRows.map((m: any) => ({
          id: m.id,
          league: m.league,
          leagueId: '',
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeBadge: undefined,
          awayBadge: undefined,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          status: m.status,
          minute: m.minute,
          kickoffAt: m.kickoffAt instanceof Date ? m.kickoffAt.toISOString() : new Date(m.kickoffAt).toISOString(),
          venue: m.venue || undefined,
          continent: m.continent || '',
          country: m.country || '',
          events: Array.isArray(m.events) ? m.events : [],
          source: 'database',
          sport: undefined,
          period: undefined,
          metadata: {},
        }));

        // Filter legacy by league name
        if (leagueName && leagueName !== 'All' && Array.isArray(matches)) {
          const lower = leagueName.toLowerCase();
          matches = matches.filter((m: any) => m.league.toLowerCase().includes(lower));
        }
      } catch (e) {
        console.warn('Legacy Match table fallback failed:', e);
      }
    }

    return NextResponse.json(matches || []);
  } catch (error) {
    console.error('Matches API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches.' },
      { status: 500 }
    );
  }
}

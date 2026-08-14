import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { batchResolveLogosFromAPI } from '@/lib/team-logo-resolver';

// ─── Batch-resolve team logos by name for matches missing badges ───────────
async function resolveMissingBadges(matches: any[]): Promise<any[]> {
  // Collect team names that don't have badges
  const missingNames = new Set<string>();
  for (const m of matches) {
    if (!m.homeBadge) missingNames.add(m.homeTeam);
    if (!m.awayBadge) missingNames.add(m.awayTeam);
  }
  if (missingNames.size === 0) return matches;

  // Build OR conditions for Prisma (chunked to avoid query limits)
  const nameList = Array.from(missingNames);
  const logoMap = new Map<string, string>();
  const CHUNK = 50;
  for (let i = 0; i < nameList.length; i += CHUNK) {
    const chunk = nameList.slice(i, i + CHUNK);
    const teams = await db.team.findMany({
      where: {
        OR: chunk.map(name => ({
          name: { equals: name, mode: 'insensitive' },
        })),
      },
      select: { name: true, logoUrl: true },
    });
    for (const t of teams) {
      if (t.logoUrl) {
        // Store with lowercase key for case-insensitive matching
        logoMap.set(t.name.toLowerCase(), t.logoUrl);
      }
    }
  }

  // Also try shortName matching for any still missing
  const stillMissing = nameList.filter(n => !logoMap.has(n.toLowerCase()));
  if (stillMissing.length > 0) {
    for (let i = 0; i < stillMissing.length; i += CHUNK) {
      const chunk = stillMissing.slice(i, i + CHUNK);
      const teams = await db.team.findMany({
        where: {
          OR: chunk.map(name => ({
            shortName: { equals: name, mode: 'insensitive' },
          })),
        },
        select: { shortName: true, name: true, logoUrl: true },
      });
      for (const t of teams) {
        if (t.logoUrl) {
          logoMap.set((t.shortName || t.name).toLowerCase(), t.logoUrl);
        }
      }
    }
  }

  // Apply resolved logos to matches
  if (logoMap.size > 0) {
    for (const m of matches) {
      if (!m.homeBadge) m.homeBadge = logoMap.get(m.homeTeam.toLowerCase()) || undefined;
      if (!m.awayBadge) m.awayBadge = logoMap.get(m.awayTeam.toLowerCase()) || undefined;
    }
  }

  // Second pass: for any STILL missing, try TheSportsDB API
  const stillMissingAfter = new Set<string>();
  for (const m of matches) {
    if (!m.homeBadge) stillMissingAfter.add(m.homeTeam);
    if (!m.awayBadge) stillMissingAfter.add(m.awayTeam);
  }

  if (stillMissingAfter.size > 0) {
    try {
      const apiLogos = await batchResolveLogosFromAPI(Array.from(stillMissingAfter));
      if (apiLogos.size > 0) {
        for (const m of matches) {
          if (!m.homeBadge) m.homeBadge = apiLogos.get(m.homeTeam.toLowerCase()) || undefined;
          if (!m.awayBadge) m.awayBadge = apiLogos.get(m.awayTeam.toLowerCase()) || undefined;
        }
        // Persist discovered logos back to Team records for future requests
        for (const [name, url] of apiLogos) {
          try {
            const team = await db.team.findFirst({
              where: { name: { equals: name, mode: 'insensitive' } },
              select: { id: true, logoUrl: true },
            });
            if (team && !team.logoUrl) {
              await db.team.update({ where: { id: team.id }, data: { logoUrl: url } });
            }
          } catch { /* ignore persist errors */ }
        }
      }
    } catch (e) {
      console.warn('[matches] TheSportsDB logo fallback failed:', e);
    }
  }

  return matches;
}

// ─── Auto-derive match status from kickoff time ───────────────────────────
// When admin forgets to update status, matches whose kickoff time has passed
// but are still 'upcoming' will automatically show as 'live' to fans.
// A football match is considered auto-finished 105 minutes after kickoff.
function deriveStatus(match: { status: string; kickoffAt: string }): {
  status: string;
  minute: number | null;
} {
  if (match.status !== 'upcoming') return { status: match.status, minute: null };

  const now = Date.now();
  const kickoff = new Date(match.kickoffAt).getTime();
  const elapsed = now - kickoff;

  // Match hasn't started yet
  if (elapsed < 0) return { status: 'upcoming', minute: null };

  // Match is within 105 min window — auto-live
  if (elapsed < 105 * 60 * 1000) {
    const mins = Math.floor(elapsed / 60000);
    // Half-time is around 45-60 min
    if (mins >= 45 && mins < 60) {
      return { status: 'ht', minute: 45 };
    }
    return { status: 'live', minute: mins };
  }

  // Over 105 min — auto-finished
  return { status: 'ft', minute: 90 };
}

// Background: auto-update stale MatchProfile records in DB
async function autoUpdateStaleMatches(matches: any[]): Promise<void> {
  const stale = matches.filter(
    (m: any) => m.status === 'upcoming' && new Date(m.kickoffAt).getTime() < Date.now()
  );
  if (stale.length === 0) return;

  const ids = stale.map((m: any) => m.id);
  try {
    // Update matches past 105 min to 'ft', others to 'live'
    const ftCutoff = Date.now() - 105 * 60 * 1000;
    const ftIds = stale.filter((m: any) => new Date(m.kickoffAt).getTime() < ftCutoff).map((m: any) => m.id);
    const liveIds = stale.filter((m: any) => new Date(m.kickoffAt).getTime() >= ftCutoff).map((m: any) => m.id);

    if (ftIds.length > 0) {
      await db.matchProfile.updateMany({
        where: { id: { in: ftIds }, status: 'upcoming' },
        data: { status: 'ft', updatedAt: new Date() },
      });
      console.log(`[auto-status] Updated ${ftIds.length} matches to ft`);
    }
    if (liveIds.length > 0) {
      await db.matchProfile.updateMany({
        where: { id: { in: liveIds }, status: 'upcoming' },
        data: { status: 'live', updatedAt: new Date() },
      });
      console.log(`[auto-status] Updated ${liveIds.length} matches to live`);
    }
  } catch (e) {
    console.warn('[auto-status] Batch update failed:', e);
  }
}

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

    // Parse date parameter into UTC start/end of day
    // dateStr is always YYYY-MM-DD in LOCAL time — treat it as UTC midnight
    // so queries are consistent regardless of server timezone
    let dateStart: Date | null = null;
    let dateEnd: Date | null = null;
    if (dateStr) {
      // Use EAT (UTC+3) day boundaries: midnight EAT = T21:00:00Z previous day
      dateStart = new Date(dateStr + 'T00:00:00.000+03:00');
      dateEnd = new Date(dateStr + 'T23:59:59.999+03:00');
    }

    if (status === 'live') {
      // Also fetch 'upcoming' matches that may have started but not updated yet
      // (kickoff within last 120 min)
      const recentCutoff = new Date(Date.now() - 120 * 60 * 1000);
      where.OR = [
        { status: { in: ['live', 'ht'] } },
        { status: 'upcoming', kickoffAt: { gte: recentCutoff, lte: new Date() } },
      ];
    } else if (status === 'upcoming') {
      where.status = 'upcoming';
      // No date filter for upcoming — always show next 14 days so
      // the client can group by date properly
      const nowUtc = new Date();
      const in14 = new Date(nowUtc.getTime() + 14 * 24 * 60 * 60 * 1000);
      where.kickoffAt = { gte: nowUtc, lte: in14 };
    } else if (status === 'results') {
      where.status = 'ft';
      if (dateStart && dateEnd) {
        where.kickoffAt = { gte: dateStart, lte: dateEnd };
      } else {
        // Default: last 14 days so client can group by date
        const nowUtc = new Date();
        const ago14 = new Date(nowUtc.getTime() - 14 * 24 * 60 * 60 * 1000);
        where.kickoffAt = { gte: ago14, lte: nowUtc };
      }
    } else if (status === 'today') {
      if (dateStart && dateEnd) {
        where.kickoffAt = { gte: dateStart, lte: dateEnd };
      } else {
        // Default: UTC today
        const nowUtc = new Date();
        const todayUtc = nowUtc.toISOString().split('T')[0];
        where.kickoffAt = {
          gte: new Date(todayUtc + 'T00:00:00.000+03:00'),
          lte: new Date(todayUtc + 'T23:59:59.999+03:00'),
        };
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

    // Auto-derive status from kickoff time for 'upcoming' matches
    for (const m of results) {
      const derived = deriveStatus(m);
      if (derived.status !== m.status) {
        m.status = derived.status;
        if (derived.minute != null && m.minute == null) m.minute = derived.minute;
      }
    }

    // Background: persist auto-derived statuses to DB
    autoUpdateStaleMatches(results).catch(() => {});

    // Resolve missing team badges by looking up teams by name
    results = await resolveMissingBadges(results);

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
          legacyDateStart = new Date(dateStr + 'T00:00:00.000+03:00');
          legacyDateEnd = new Date(dateStr + 'T23:59:59.999+03:00');
        }
        if (status === 'live') {
          where.status = { in: ['live', 'ht'] };
        } else if (status === 'upcoming') {
          where.status = 'upcoming';
          const nowUtc = new Date();
          const in14 = new Date(nowUtc.getTime() + 14 * 24 * 60 * 60 * 1000);
          where.kickoffAt = { gte: nowUtc, lte: in14 };
        } else if (status === 'results') {
          where.status = 'ft';
          if (legacyDateStart && legacyDateEnd) {
            where.kickoffAt = { gte: legacyDateStart, lte: legacyDateEnd };
          } else {
            const nowUtc = new Date();
            const ago14 = new Date(nowUtc.getTime() - 14 * 24 * 60 * 60 * 1000);
            where.kickoffAt = { gte: ago14, lte: nowUtc };
          }
        } else if (status === 'today') {
          if (legacyDateStart && legacyDateEnd) {
            where.kickoffAt = { gte: legacyDateStart, lte: legacyDateEnd };
          } else {
            const nowUtc = new Date();
            const todayUtc = nowUtc.toISOString().split('T')[0];
            where.kickoffAt = {
              gte: new Date(todayUtc + 'T00:00:00.000Z'),
              lte: new Date(todayUtc + 'T23:59:59.999Z'),
            };
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
          homeBadge: undefined as string | undefined,
          awayBadge: undefined as string | undefined,
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

        // Auto-derive status for legacy matches too
        for (const m of matches) {
          const derived = deriveStatus(m);
          if (derived.status !== m.status) {
            m.status = derived.status;
            if (derived.minute != null && m.minute == null) m.minute = derived.minute;
          }
        }

        // Filter legacy by league name
        if (leagueName && leagueName !== 'All' && Array.isArray(matches)) {
          const lower = leagueName.toLowerCase();
          matches = matches.filter((m: any) => m.league.toLowerCase().includes(lower));
        }
      } catch (e) {
        console.warn('Legacy Match table fallback failed:', e);
      }
    }

    // Resolve missing badges for legacy matches too
    if (matches && matches.length > 0) {
      matches = await resolveMissingBadges(matches);
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

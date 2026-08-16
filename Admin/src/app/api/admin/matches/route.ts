import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/matches
 * POST /api/admin/matches — create MatchProfile + fan-app Match mirror
 *
 * Body:
 * {
 *   homeTeamId?, awayTeamId?, homeTeamName, awayTeamName,
 *   homeScore?, awayScore?, status?, minute?, period?,
 *   venue?, kickoffAt, leagueId?, sportId?, leagueName?,
 *   events?: [], stats?: {}, lineups?: {}, coaches?: {},
 *   referee?, attendance?, continent?, country?,
 *   publishToFan?: boolean (default true)
 * }
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';
    const leagueId = searchParams.get('leagueId') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where: any = {};
    if (status) where.status = status;
    if (leagueId) where.leagueId = leagueId;
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      where.kickoffAt = { gte: start, lte: end };
    }

    const [total, matches] = await Promise.all([
      db.matchProfile.count({ where }),
      db.matchProfile.findMany({
        where,
        orderBy: { kickoffAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          League: { select: { id: true, name: true } },
          Sport: { select: { id: true, name: true, icon: true } },
          Team_MatchProfile_homeTeamIdToTeam: { select: { id: true, name: true, logoUrl: true } },
          Team_MatchProfile_awayTeamIdToTeam: { select: { id: true, name: true, logoUrl: true } },
        },
      }),
    ]);

    return NextResponse.json({ data: matches, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches', detail: String(error) },
      { status: 500 }
    );
  }
}

const ALLOWED_STATUS = new Set([
  'upcoming', 'live', 'ht', 'ft', 'postponed', 'cancelled', 'suspended',
]);

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const homeTeamName = String(body.homeTeamName || '').trim();
    const awayTeamName = String(body.awayTeamName || '').trim();
    if (!homeTeamName || !awayTeamName) {
      return NextResponse.json(
        { ok: false, error: 'homeTeamName and awayTeamName are required' },
        { status: 400 }
      );
    }
    if (!body.kickoffAt) {
      return NextResponse.json(
        { ok: false, error: 'kickoffAt is required (ISO datetime)' },
        { status: 400 }
      );
    }

    const kickoffAt = new Date(body.kickoffAt);
    if (Number.isNaN(kickoffAt.getTime())) {
      return NextResponse.json({ ok: false, error: 'Invalid kickoffAt' }, { status: 400 });
    }

    let status = String(body.status || 'upcoming').toLowerCase();
    if (!ALLOWED_STATUS.has(status)) status = 'upcoming';

    const homeScore =
      body.homeScore === '' || body.homeScore == null ? null : Number(body.homeScore);
    const awayScore =
      body.awayScore === '' || body.awayScore == null ? null : Number(body.awayScore);
    const minute =
      body.minute === '' || body.minute == null ? null : Number(body.minute);

    const events = Array.isArray(body.events) ? body.events : [];
    const metadata = {
      stats: body.stats || {},
      lineups: body.lineups || { home: [], away: [] },
      coaches: body.coaches || {},
      referee: body.referee || null,
      attendance: body.attendance != null && body.attendance !== '' ? Number(body.attendance) : null,
      period: body.period || null,
      notes: body.notes || null,
      fanMatchId: null as string | null,
    };

    // Resolve team names from IDs if provided
    let homeName = homeTeamName;
    let awayName = awayTeamName;
    let homeLogo: string | null = null;
    let awayLogo: string | null = null;
    if (body.homeTeamId) {
      const t = await db.team.findUnique({ where: { id: body.homeTeamId }, select: { name: true, logoUrl: true } });
      if (t) { homeName = t.name; homeLogo = t.logoUrl; }
    }
    if (body.awayTeamId) {
      const t = await db.team.findUnique({ where: { id: body.awayTeamId }, select: { name: true, logoUrl: true } });
      if (t) { awayName = t.name; awayLogo = t.logoUrl; }
    }

    let leagueName = String(body.leagueName || '').trim();
    if (!leagueName && body.leagueId) {
      const l = await db.league.findUnique({ where: { id: body.leagueId }, select: { name: true } });
      if (l) leagueName = l.name;
    }
    if (!leagueName) leagueName = 'Friendly';

    const id = randomUUID();
    const profile = await db.matchProfile.create({
      data: {
        id,
        homeTeamName: homeName,
        awayTeamName: awayName,
        homeTeamId: body.homeTeamId || null,
        awayTeamId: body.awayTeamId || null,
        homeScore: Number.isFinite(homeScore as number) ? (homeScore as number) : null,
        awayScore: Number.isFinite(awayScore as number) ? (awayScore as number) : null,
        status,
        minute: Number.isFinite(minute as number) ? (minute as number) : null,
        period: body.period || null,
        venue: body.venue?.trim() || null,
        kickoffAt,
        leagueId: body.leagueId || null,
        sportId: body.sportId || null,
        events,
        source: 'admin',
        createdByAI: false,
        metadata,
        updatedAt: new Date(),
      },
    });

    let fanMatch = null;
    const publishToFan = body.publishToFan !== false;
    if (publishToFan) {
      fanMatch = await db.match.create({
        data: {
          league: leagueName,
          homeTeam: homeName,
          awayTeam: awayName,
          homeScore: profile.homeScore,
          awayScore: profile.awayScore,
          status: mapStatusForFan(status),
          minute: profile.minute,
          venue: profile.venue,
          kickoffAt,
          continent: body.continent || 'Europe',
          country: body.country || '',
          events,
        },
      });
      // link ids in metadata
      await db.matchProfile.update({
        where: { id },
        data: {
          metadata: { ...metadata, fanMatchId: fanMatch.id, homeLogo, awayLogo },
          externalId: fanMatch.id,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(
      { ok: true, matchProfile: profile, fanMatch },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('POST /api/admin/matches:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function mapStatusForFan(status: string): string {
  if (status === 'ht') return 'ht';
  if (status === 'ft') return 'ft';
  if (status === 'live') return 'live';
  if (status === 'postponed') return 'postponed';
  if (status === 'cancelled') return 'cancelled';
  return 'upcoming';
}

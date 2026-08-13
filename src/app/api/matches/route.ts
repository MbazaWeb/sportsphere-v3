import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function mapDbMatch(m: {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: number | null;
  venue: string | null;
  kickoffAt: Date;
  continent: string;
  country: string;
  events: unknown;
}) {
  return {
    id: m.id,
    league: m.league,
    leagueId: '',
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status as any,
    minute: m.minute,
    kickoffAt: m.kickoffAt.toISOString(),
    venue: m.venue || undefined,
    continent: m.continent,
    country: m.country,
    events: Array.isArray(m.events) ? m.events : [],
    source: 'database',
  };
}

async function loadDbMatches(status: string) {
  try {
    const where: any = {};
    const now = new Date();
    if (status === 'live') {
      where.status = { in: ['live', 'ht'] };
    } else if (status === 'upcoming') {
      where.status = 'upcoming';
      where.kickoffAt = { gte: now };
    } else if (status === 'results') {
      where.status = 'ft';
    } else if (status === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      where.kickoffAt = { gte: start, lte: end };
    }
    const rows = await db.match.findMany({
      where,
      orderBy: { kickoffAt: status === 'results' ? 'desc' : 'asc' },
      take: 50,
    });
    return rows.map(mapDbMatch);
  } catch (e) {
    console.warn('DB matches load failed:', e);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') || 'live';
    const leagueName = searchParams.get('league');

    // Tanzania baseline: fetch matches from local database only
    const matches = await loadDbMatches(status);

    // Filter by league name if specified
    let filtered = matches;
    if (leagueName && leagueName !== 'All' && Array.isArray(matches)) {
      const lower = leagueName.toLowerCase();
      filtered = matches.filter(
        (m: { league: string }) => m.league.toLowerCase().includes(lower)
      );
    }

    return NextResponse.json(filtered || []);
  } catch (error) {
    console.error('Matches API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches.' },
      { status: 500 }
    );
  }
}

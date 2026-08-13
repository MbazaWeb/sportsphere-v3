import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/teams/matches?team=TeamName&limit=5
// Returns upcoming + recent finished matches for a specific team.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const teamName = searchParams.get('team');
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (!teamName) {
      return NextResponse.json({ error: 'Team name required.' }, { status: 400 });
    }

    const now = new Date();

    // Upcoming matches
    const upcoming = await db.match.findMany({
      where: {
        OR: [
          { homeTeam: { contains: teamName, mode: 'insensitive' } },
          { awayTeam: { contains: teamName, mode: 'insensitive' } },
        ],
        status: 'upcoming',
        kickoffAt: { gte: now },
      },
      orderBy: { kickoffAt: 'asc' },
      take: limit,
    });

    // Recent results (last N finished)
    const results = await db.match.findMany({
      where: {
        OR: [
          { homeTeam: { contains: teamName, mode: 'insensitive' } },
          { awayTeam: { contains: teamName, mode: 'insensitive' } },
        ],
        status: 'ft',
      },
      orderBy: { kickoffAt: 'desc' },
      take: limit,
    });

    // Live matches
    const live = await db.match.findMany({
      where: {
        OR: [
          { homeTeam: { contains: teamName, mode: 'insensitive' } },
          { awayTeam: { contains: teamName, mode: 'insensitive' } },
        ],
        status: { in: ['live', 'ht'] },
      },
      orderBy: { kickoffAt: 'desc' },
      take: 3,
    });

    const mapMatch = (m: any) => ({
      id: m.id,
      league: m.league,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
      minute: m.minute,
      kickoffAt: m.kickoffAt.toISOString(),
      venue: m.venue || undefined,
    });

    return NextResponse.json({
      live: live.map(mapMatch),
      upcoming: upcoming.map(mapMatch),
      results: results.map(mapMatch),
    });
  } catch (error) {
    console.error('Team matches API error:', error);
    return NextResponse.json({ error: 'Failed to fetch team matches.' }, { status: 500 });
  }
}

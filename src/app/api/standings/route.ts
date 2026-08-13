// GET /api/standings — Return standings for Tanzania leagues from LOCAL DB
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const leagueSlug = searchParams.get('league') || searchParams.get('id') || 'vodacom-premier-league';

    // Find the league in our database
    const league = await db.league.findUnique({
      where: { slug: leagueSlug },
      include: {
        Sport: { select: { name: true, slug: true, icon: true } },
      },
    });

    if (!league) {
      return NextResponse.json({
        league: leagueSlug,
        standings: [],
        available: await getAvailableLeagues(),
        message: 'League not found in database.',
      });
    }

    // Find teams in this league — standings will be populated when matches exist
    const teams = await db.team.findMany({
      where: { leagueId: league.id, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        shortName: true,
        city: true,
        country: true,
        venue: true,
        logoUrl: true,
      },
    });

    const standings = teams.map((t, i) => ({
      pos: i + 1,
      team: t.shortName || t.name,
      badge: t.logoUrl || undefined,
      slug: t.slug,
      city: t.city,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
    }));

    return NextResponse.json({
      league: league.name,
      leagueId: league.id,
      leagueSlug: league.slug,
      type: league.type,
      country: league.country,
      sport: league.Sport,
      season: league.season,
      standings,
      available: await getAvailableLeagues(),
      source: 'database',
    });
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings.' },
      { status: 500 }
    );
  }
}

async function getAvailableLeagues(): Promise<string[]> {
  const leagues = await db.league.findMany({
    where: { isActive: true, type: 'league' },
    orderBy: { name: 'asc' },
    select: { name: true },
  });
  return leagues.map((l) => l.name);
}

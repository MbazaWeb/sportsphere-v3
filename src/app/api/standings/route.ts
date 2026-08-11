import { NextRequest, NextResponse } from 'next/server';
import { getStandings, POPULAR_LEAGUE_IDS, FD_COMPETITIONS } from '@/lib/sports-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const leagueName = searchParams.get('league') || 'English Premier League';
    const leagueId = searchParams.get('id');

    let id = leagueId || POPULAR_LEAGUE_IDS[leagueName] || '2021';

    const standings = await getStandings(id);
    return NextResponse.json({
      league: leagueName,
      leagueId: id,
      standings,
    });
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings.' },
      { status: 502 }
    );
  }
}

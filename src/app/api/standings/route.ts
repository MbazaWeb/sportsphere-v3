import { NextRequest, NextResponse } from 'next/server';
import { getStandings, POPULAR_LEAGUE_IDS } from '@/lib/sports-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const leagueName = searchParams.get('league') || 'English Premier League';

    const leagueId = POPULAR_LEAGUE_IDS[leagueName] || '4328';
    const standings = await getStandings(leagueId);

    return NextResponse.json({
      standings,
      league: leagueName,
      available: Object.keys(POPULAR_LEAGUE_IDS),
    });
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings.' },
      { status: 502 }
    );
  }
}

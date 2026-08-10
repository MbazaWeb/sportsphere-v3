import { NextRequest, NextResponse } from 'next/server';
import { getStandings, getLeagues, POPULAR_LEAGUE_IDS } from '@/lib/sports-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const leagueName = searchParams.get('league') || 'English Premier League';

    const leagueId = POPULAR_LEAGUE_IDS[leagueName] || '4328';
    const standings = await getStandings(leagueId);

    // Fetch real available leagues from the sports API
    let available = Object.keys(POPULAR_LEAGUE_IDS);
    try {
      const apiLeagues = await getLeagues();
      if (apiLeagues.length > 0) {
        // Merge: keep popular ones first, then add any new ones from the API
        const existing = new Set(available.map(l => l.toLowerCase()));
        for (const l of apiLeagues) {
          if (l.name && !existing.has(l.name.toLowerCase()) && l.badge) {
            available.push(l.name);
          }
        }
      }
    } catch { /* keep defaults */ }

    return NextResponse.json({
      standings,
      league: leagueName,
      available,
    });
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings.' },
      { status: 502 }
    );
  }
}

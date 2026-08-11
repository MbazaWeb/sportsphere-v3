import { NextRequest, NextResponse } from 'next/server';
import {
  getLiveMatches,
  getMatchesByDate,
  getPastResults,
  getUpcomingFixtures,
  getStandings,
  POPULAR_LEAGUE_IDS,
} from '@/lib/sports-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') || 'live';
    const leagueName = searchParams.get('league');

    let matches: any[];

    switch (status) {
      case 'live': {
        matches = await getLiveMatches();
        break;
      }
      case 'today': {
        const today = new Date().toISOString().slice(0, 10);
        matches = await getMatchesByDate(today);
        break;
      }
      case 'results': {
        if (leagueName && leagueName !== 'All' && POPULAR_LEAGUE_IDS[leagueName]) {
          matches = await getPastResults(POPULAR_LEAGUE_IDS[leagueName]);
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          matches = await getMatchesByDate(yesterday.toISOString().slice(0, 10));
        }
        break;
      }
      case 'upcoming': {
        if (leagueName && leagueName !== 'All' && POPULAR_LEAGUE_IDS[leagueName]) {
          matches = await getUpcomingFixtures(POPULAR_LEAGUE_IDS[leagueName]);
        } else {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          matches = await getMatchesByDate(tomorrow.toISOString().slice(0, 10));
        }
        break;
      }
      default:
        matches = [];
    }

    // Filter by league name if provided
    if (leagueName && leagueName !== 'All' && Array.isArray(matches)) {
      const lower = leagueName.toLowerCase();
      matches = matches.filter(
        (m: { league: string }) => m.league.toLowerCase().includes(lower)
      );
    }

    return NextResponse.json(matches || []);
  } catch (error) {
    console.error('Matches API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches. The sports API may be temporarily unavailable.' },
      { status: 502 }
    );
  }
}
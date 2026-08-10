import { NextResponse } from 'next/server';
import { getLeagues, POPULAR_LEAGUE_IDS, type LeagueInfo } from '@/lib/sports-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allLeagues = await getLeagues();

    // Merge with our popular list to ensure key leagues are always present
    const popularSet = new Set(Object.keys(POPULAR_LEAGUE_IDS));
    const merged: LeagueInfo[] = [];

    // Popular leagues first
    for (const name of Object.keys(POPULAR_LEAGUE_IDS)) {
      const found = allLeagues.find(
        (l) => l.name === name || l.id === POPULAR_LEAGUE_IDS[name]
      );
      merged.push(
        found || {
          id: POPULAR_LEAGUE_IDS[name],
          name,
          country: '',
          sport: 'Soccer',
        }
      );
    }

    // Then the rest from the API
    for (const l of allLeagues) {
      if (!popularSet.has(l.name)) {
        merged.push(l);
      }
    }

    return NextResponse.json(merged);
  } catch (error) {
    console.error('Leagues API error:', error);
    // Fallback: return popular leagues only
    return NextResponse.json(
      Object.keys(POPULAR_LEAGUE_IDS).map((name) => ({
        id: POPULAR_LEAGUE_IDS[name],
        name,
        country: '',
        sport: 'Soccer',
      }))
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const league = searchParams.get('league');

    const filePath = path.join(process.cwd(), 'prisma', 'standings.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const allStandings = JSON.parse(fileContent);

    // Always return a Record<string, StandingRow[]> so the frontend can
    // index by league name regardless of whether a filter is applied.
    const out =
      league && league !== 'All'
        ? { [league]: allStandings[league] || [] }
        : allStandings;

    return NextResponse.json({
      standings: out,
      available: Object.keys(allStandings),
    });
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}

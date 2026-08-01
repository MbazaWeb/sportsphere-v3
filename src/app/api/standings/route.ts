import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const league = searchParams.get('league');

    const filePath = path.join(process.cwd(), 'prisma', 'standings.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const allStandings = JSON.parse(fileContent);

    if (league && league !== 'All') {
      const leagueData = allStandings[league] || [];
      return NextResponse.json({ standings: leagueData, available: Object.keys(allStandings) });
    }

    return NextResponse.json({ standings: allStandings, available: Object.keys(allStandings) });
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}

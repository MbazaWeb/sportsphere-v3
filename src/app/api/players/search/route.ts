import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const searchPattern = `%${query}%`;

  try {
    const players: any[] = await db.$queryRaw`
      SELECT id, full_name, photo_url, position, current_team, ppi_score 
      FROM players 
      WHERE full_name ILIKE ${searchPattern} 
         OR current_team ILIKE ${searchPattern} 
         OR position ILIKE ${searchPattern}
      ORDER BY ppi_score DESC 
      LIMIT 10
    `;

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Player search error:', error);
    return NextResponse.json({ error: 'Failed to search players' }, { status: 500 });
  }
}

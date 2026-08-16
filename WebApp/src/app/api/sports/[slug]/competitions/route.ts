// GET /api/sports/[slug]/competitions — Get competitions for a sport from LOCAL DB
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find sport first
    const sport = await db.sport.findUnique({
      where: { slug },
    });

    if (!sport) {
      return NextResponse.json({ competitions: [], message: 'Sport not found.' }, { status: 404 });
    }

    // Fetch competitions from our database
    const competitions = await db.league.findMany({
      where: { sportId: sport.id, isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        country: true,
        countryCode: true,
        season: true,
        description: true,
        verified: true,
        metadata: true,
      },
    });

    // Group by type for structured display
    const grouped: Record<string, typeof competitions> = {
      league: [],
      cup: [],
      tournament: [],
      championship: [],
    };

    for (const comp of competitions) {
      const bucket = grouped[comp.type] || grouped['tournament'];
      bucket.push(comp);
    }

    return NextResponse.json({
      sport: { name: sport.name, slug: sport.slug, icon: sport.icon },
      competitions,
      grouped,
      total: competitions.length,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch competitions:', error);
    return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
  }
}

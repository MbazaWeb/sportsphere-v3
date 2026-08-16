// GET /api/leagues — Return Tanzania competitions from LOCAL DB
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leagues = await db.league.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: {
        Sport: {
          select: { name: true, slug: true, icon: true },
        },
      },
    });

    // Return available league names for the dropdown + full data
    const available = leagues.map((l) => l.name);
    const full = leagues.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      type: l.type,
      country: l.country,
      countryCode: l.countryCode,
      season: l.season,
      description: l.description,
      sport: l.Sport, // Prisma relation name is capitalized
      verified: l.verified,
    }));

    return NextResponse.json({
      available,
      leagues: full,
      total: full.length,
      source: 'database',
    });
  } catch (error) {
    console.error('Leagues API error:', error);
    return NextResponse.json(
      { available: [], leagues: [], error: 'Failed to fetch leagues.' },
      { status: 500 }
    );
  }
}

// GET /api/sports/[slug]/teams — Get teams for a sport from LOCAL DB
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = request.nextUrl;
    const leagueSlug = searchParams.get('league');
    const search = searchParams.get('search');

    // Find sport first
    const sport = await db.sport.findUnique({
      where: { slug },
    });

    if (!sport) {
      return NextResponse.json({ teams: [], message: 'Sport not found.' }, { status: 404 });
    }

    // Build where clause
    const where: any = {
      sportId: sport.id,
      isActive: true,
    };

    if (leagueSlug) {
      const league = await db.league.findUnique({ where: { slug: leagueSlug } });
      if (league) {
        where.leagueId = league.id;
      }
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const teams = await db.team.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        league: {
          select: { name: true, slug: true, type: true },
        },
        sport: {
          select: { name: true, slug: true, icon: true },
        },
      },
      take: 100,
    });

    return NextResponse.json({
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        shortName: t.shortName,
        city: t.city,
        country: t.country,
        countryCode: t.countryCode,
        venue: t.venue,
        foundedYear: t.foundedYear,
        verified: t.verified,
        logoUrl: t.logoUrl,
        league: t.league,
        sport: t.sport,
      })),
      total: teams.length,
      sport: { name: sport.name, slug: sport.slug, icon: sport.icon },
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

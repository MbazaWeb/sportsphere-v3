import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/players
 * List users that have a player profile (public fields only — no email).
 * Query: ?q=&limit=20&position=
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = (searchParams.get('q') || '').trim();
    const position = (searchParams.get('position') || '').trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 50);

    const where: Record<string, unknown> = {
      playerProfile: { isNot: null },
    };

    const and: Record<string, unknown>[] = [];

    if (q) {
      and.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { handle: { contains: q, mode: 'insensitive' } },
          { playerProfile: { position: { contains: q, mode: 'insensitive' } } },
          { playerProfile: { currentClub: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    if (position) {
      and.push({
        playerProfile: { position: { contains: position, mode: 'insensitive' } },
      });
    }

    if (and.length) {
      where.AND = and;
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        handle: true,
        avatarUrl: true,
        playerProfile: {
          select: {
            position: true,
            currentClub: true,
            rating: true,
            nationality: true,
            jerseyNumber: true,
            goals: true,
            assists: true,
            appearances: true,
          },
        },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    const players = users
      .filter((u) => u.playerProfile)
      .map((u) => ({
        id: u.id,
        full_name: u.name || u.handle,
        handle: u.handle,
        photo_url: u.avatarUrl,
        position: u.playerProfile?.position ?? null,
        current_team: u.playerProfile?.currentClub ?? null,
        ppi_score: u.playerProfile?.rating ?? 0,
        nationality: u.playerProfile?.nationality ?? null,
        jersey_number: u.playerProfile?.jerseyNumber ?? null,
        goals: u.playerProfile?.goals ?? 0,
        assists: u.playerProfile?.assists ?? 0,
        matches_played: u.playerProfile?.appearances ?? 0,
      }))
      .sort((a, b) => (b.ppi_score ?? 0) - (a.ppi_score ?? 0));

    return NextResponse.json({ players, count: players.length });
  } catch (error) {
    console.error('Players list error:', error);
    return NextResponse.json({ error: 'Failed to list players' }, { status: 500 });
  }
}

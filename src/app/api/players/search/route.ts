import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').toLowerCase();

  try {
    const users = await db.user.findMany({
      where: {
        playerProfile: { isNot: null },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { handle: { contains: query, mode: 'insensitive' } },
          { playerProfile: { position: { contains: query, mode: 'insensitive' } } },
          { playerProfile: { currentClub: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { playerProfile: true },
      take: 10,
    });

    const players = users
      .sort((a, b) => (b.playerProfile?.rating ?? 0) - (a.playerProfile?.rating ?? 0))
      .map(u => ({
        id: u.id,
        full_name: u.name || u.handle,
        photo_url: u.avatarUrl,
        position: u.playerProfile?.position ?? null,
        current_team: u.playerProfile?.currentClub ?? null,
        ppi_score: u.playerProfile?.rating ?? 0,
      }));

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Player search error:', error);
    return NextResponse.json({ error: 'Failed to search players' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serializePublicUser } from '@/lib/auth';
import { USER_SELECT } from '@/lib/db-selects';

export const dynamic = 'force-dynamic';

/**
 * Enrich users with logo/badge from the Team/League/Player tables.
 * Team and league accounts store their official logo in a separate model —
 * fall back to that when the user's own avatarUrl is not set.
 */
async function enrichWithLogos(users: any[]): Promise<any[]> {
  const teamUsers = users.filter((u) => u.role === 'team' && !u.avatarUrl);
  const leagueUsers = users.filter((u) => u.role === 'league' && !u.avatarUrl);

  if (teamUsers.length === 0 && leagueUsers.length === 0) return users;

  // Batch-fetch matching Team rows by name
  const teamNames = teamUsers.map((u) => u.name);
  const leagueNames = leagueUsers.map((u) => u.name);

  const [teams, leagues] = await Promise.all([
    teamNames.length > 0
      ? db.team.findMany({
          where: { name: { in: teamNames } },
          select: { name: true, logoUrl: true },
        })
      : [],
    leagueNames.length > 0
      ? db.league.findMany({
          where: { name: { in: leagueNames } },
          select: { name: true, logoUrl: true },
        })
      : [],
  ]);

  const teamLogoMap = new Map(teams.map((t) => [t.name.toLowerCase(), t.logoUrl]));
  const leagueLogoMap = new Map(leagues.map((l) => [l.name.toLowerCase(), l.logoUrl]));

  return users.map((u) => {
    if (u.avatarUrl) return u;
    const key = u.name.toLowerCase();
    const logo =
      u.role === 'team'
        ? teamLogoMap.get(key)
        : u.role === 'league'
        ? leagueLogoMap.get(key)
        : null;
    if (logo) return { ...u, avatarUrl: logo };
    return u;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const handle = searchParams.get('handle');
    const q = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (handle) {
      const user = await db.user.findUnique({ where: { handle }, select: USER_SELECT });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      const [enriched] = await enrichWithLogos([serializePublicUser(user)]);
      return NextResponse.json(enriched);
    }

    if (q) {
      const users = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { handle: { contains: q, mode: 'insensitive' } },
            { bio: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { followerCount: 'desc' },
        select: USER_SELECT,
      });
      return NextResponse.json(await enrichWithLogos(users.map(serializePublicUser)));
    }

    const users = await db.user.findMany({
      take: limit,
      orderBy: { followerCount: 'desc' },
      select: USER_SELECT,
    });
    return NextResponse.json(await enrichWithLogos(users.map(serializePublicUser)));
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

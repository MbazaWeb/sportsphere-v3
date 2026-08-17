import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serializePublicUser } from '@/lib/auth';

// Enrich team/league/player users with logo from Team/League tables
async function enrichWithLogos(users: any[]): Promise<any[]> {
  const teamUsers = users.filter((u) => u.role === 'team' && !u.avatarUrl);
  const leagueUsers = users.filter((u) => u.role === 'league' && !u.avatarUrl);
  const playerUsers = users.filter((u) => u.role === 'player' && !u.avatarUrl);
  if (teamUsers.length === 0 && leagueUsers.length === 0 && playerUsers.length === 0) return users;
  const [teams, leagues] = await Promise.all([
    teamUsers.length > 0 ? db.team.findMany({ where: { name: { in: teamUsers.map(u => u.name) } }, select: { name: true, logoUrl: true } }) : [],
    leagueUsers.length > 0 ? db.league.findMany({ where: { name: { in: leagueUsers.map(u => u.name) } }, select: { name: true, logoUrl: true } }) : [],
  ]);
  const teamMap = new Map(teams.map(t => [t.name.toLowerCase(), t.logoUrl]));
  const leagueMap = new Map(leagues.map(l => [l.name.toLowerCase(), l.logoUrl]));
  return users.map(u => {
    if (u.avatarUrl) return u;
    const key = u.name.toLowerCase();
    const logo = u.role === 'team' ? teamMap.get(key) : u.role === 'league' ? leagueMap.get(key) : null;
    return logo ? { ...u, avatarUrl: logo } : u;
  });
}

export const dynamic = 'force-dynamic';

// GET /api/users/top — top accounts by follower count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);

    const users = await db.user.findMany({
      where: { followerCount: { gt: 0 } },
      orderBy: { followerCount: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        handle: true,
        role: true,
        avatarUrl: true,
        isVerified: true,
        isPro: true,
        followerCount: true,
        fanCount: true,
      },
    });

    const enriched = await enrichWithLogos(users);
    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Top users error:', error);
    return NextResponse.json([]);
  }
}

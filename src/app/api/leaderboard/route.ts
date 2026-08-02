import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const USER_SELECT = {
  id: true, name: true, email: true, handle: true, avatarUrl: true,
  avatarInitials: true, role: true, verificationStatus: true, isVerified: true,
  bio: true, location: true, coverGradient: true, followerCount: true,
  followingCount: true, postCount: true, sportsFollowing: true, roleData: true,
  registeredAt: true,
} as const;

// GET /api/leaderboard — top users by follower count + post activity
// In a production app this would be based on prediction points earned.
export async function GET() {
  try {
    const users = await db.user.findMany({
      where: { followerCount: { gt: 0 } },
      select: USER_SELECT,
      orderBy: [{ followerCount: 'desc' }],
      take: 10,
    });

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      ...u,
      points: u.followerCount, // Using follower count as a proxy for "points"
      roleData: safeJsonParse(u.roleData, {}),
      sportsFollowing: safeJsonParse(u.sportsFollowing, []),
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

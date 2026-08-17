import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/users/suggested — returns suggested accounts for the feed
// Returns users with sports roles, sorted by follower count
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request).catch(() => null);
    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20);

    const sportsRoles = ['player', 'team', 'coach', 'national_team', 'league', 
                         'competition', 'academy', 'media', 'journalist', 'creator'];

    // Get users with sports roles, exclude current user and already-followed
    const where: any = {
      role: { in: sportsRoles },
      ...(userId ? { id: { not: userId } } : {}),
    };

    // Exclude already followed if logged in
    if (userId) {
      const following = await db.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map(f => f.followingId);
      if (followingIds.length > 0) {
        where.id = { notIn: followingIds, ...(userId ? { not: userId } : {}) };
      }
    }

    const users = await db.user.findMany({
      where,
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
        typeName: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Suggested users error:', error);
    return NextResponse.json([]);
  }
}

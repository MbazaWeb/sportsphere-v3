import { NextRequest, NextResponse } from 'next/server';
import { safeJsonParse } from '@/lib/json';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const USER_SELECT = {
  id: true, name: true, email: true, handle: true, avatarUrl: true,
  avatarInitials: true, role: true, verificationStatus: true, isVerified: true,
  bio: true, location: true, coverGradient: true, followerCount: true,
  followingCount: true, postCount: true, sportsFollowing: true, roleData: true,
  registeredAt: true,
} as const;

// POST — toggle follow (requires auth)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required.' }, { status: 400 });
    }

    if (userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself.' }, { status: 400 });
    }

    // Check if target user exists
    const target = await db.user.findUnique({ where: { id: String(targetUserId) } });
    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Check existing follow
    const existing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: String(targetUserId) } },
    });

    if (existing) {
      // Unfollow
      await db.follow.delete({ where: { followerId_followingId: { followerId: userId, followingId: String(targetUserId) } } });
      await db.user.update({ where: { id: userId }, data: { followingCount: { decrement: 1 } } });
      await db.user.update({ where: { id: String(targetUserId) }, data: { followerCount: { decrement: 1 } } });
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await db.follow.create({ data: { followerId: userId, followingId: String(targetUserId) } });
      await db.user.update({ where: { id: userId }, data: { followingCount: { increment: 1 } } });
      await db.user.update({ where: { id: String(targetUserId) }, data: { followerCount: { increment: 1 } } });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 });
  }
}

// GET — list followers or following for a user
// ?userId=xxx&type=followers  → people who follow userId
// ?userId=xxx&type=following  → people userId follows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'following';

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    let users;
    if (type === 'followers') {
      const follows = await db.follow.findMany({
        where: { followingId: userId },
        select: { follower: { select: USER_SELECT } },
        orderBy: { createdAt: 'desc' },
      });
      users = follows.map((f) => f.follower);
    } else {
      const follows = await db.follow.findMany({
        where: { followerId: userId },
        select: { following: { select: USER_SELECT } },
        orderBy: { createdAt: 'desc' },
      });
      users = follows.map((f) => f.following);
    }

    const parsed = users.map((u) => ({
      ...u,
      roleData: safeJsonParse(u.roleData, {}),
      sportsFollowing: safeJsonParse(u.sportsFollowing, []),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Follow list error:', error);
    return NextResponse.json({ error: 'Failed to fetch follow list' }, { status: 500 });
  }
}


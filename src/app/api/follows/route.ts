import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { safeJsonParse } from '@/lib/json';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/db-selects';

export const dynamic = 'force-dynamic';


// POST — toggle follow (requires auth)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
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
    } else {
      // Follow
      await db.follow.create({ data: { followerId: userId, followingId: String(targetUserId) } });
    }

    // Always reconcile counts from source of truth (avoids negative drift)
    const [myFollowing, theirFollowers] = await Promise.all([
      db.follow.count({ where: { followerId: userId } }),
      db.follow.count({ where: { followingId: String(targetUserId) } }),
    ]);
    await Promise.all([
      db.user.update({ where: { id: userId }, data: { followingCount: myFollowing } }),
      db.user.update({ where: { id: String(targetUserId) }, data: { followerCount: theirFollowers } }),
    ]);

    return NextResponse.json({
      following: !existing,
      followerCount: theirFollowers,
      followingCount: myFollowing,
    });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 });
  }
}

// PATCH — recalculate follow counts (admin/maintenance)
export async function PATCH() {
  try {
    // Recalculate all follower/following counts from actual Follow records
    const allUsers = await db.user.findMany({ select: { id: true } });
    
    for (const user of allUsers) {
      const followerCount = await db.follow.count({ where: { followingId: user.id } });
      const followingCount = await db.follow.count({ where: { followerId: user.id } });
      const postCount = await db.post.count({ where: { userId: user.id } });
      
      await db.user.update({
        where: { id: user.id },
        data: { followerCount, followingCount, postCount },
      });
    }
    
    return NextResponse.json({ success: true, recalculated: allUsers.length });
  } catch (error) {
    console.error('Follow count recalculation error:', error);
    return NextResponse.json({ error: 'Failed to recalculate' }, { status: 500 });
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

    // Allow ?userId=me for the authenticated viewer
    let resolvedUserId = userId;
    if (userId === 'me') {
      const me = await getUserIdFromRequest(request);
      if (!me) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      }
      resolvedUserId = me;
    }

    let users;
    if (type === 'followers') {
      const follows = await db.follow.findMany({
        where: { followingId: resolvedUserId },
        select: { follower: { select: USER_SELECT } },
        orderBy: { createdAt: 'desc' },
      });
      users = follows.map((f: typeof follows[number]) => f.follower);
    } else {
      const follows = await db.follow.findMany({
        where: { followerId: resolvedUserId },
        select: { following: { select: USER_SELECT } },
        orderBy: { createdAt: 'desc' },
      });
      users = follows.map((f: typeof follows[number]) => f.following);
    }

    const parsed = users.map((u: typeof users[number]) => ({
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

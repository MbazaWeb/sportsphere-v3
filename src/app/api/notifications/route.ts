import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  handle: true,
  avatarUrl: true,
  avatarInitials: true,
  role: true,
  verificationStatus: true,
  isVerified: true,
  bio: true,
  location: true,
  coverGradient: true,
  followerCount: true,
  followingCount: true,
  postCount: true,
  sportsFollowing: true,
  roleData: true,
  registeredAt: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const targetUserId = request.headers.get('x-user-id');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const notifications = await db.notification.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        isRead: true,
        referenceId: true,
        createdAt: true,
        actor: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

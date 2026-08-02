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

export async function GET() {
  try {
    const communities = await db.community.findMany({
      select: {
        id: true, name: true, description: true, topic: true,
        memberCount: true, createdById: true, createdAt: true,
        createdBy: { select: USER_SELECT },
      },
      orderBy: { memberCount: 'desc' },
      take: 20,
    });

    return NextResponse.json(communities);
  } catch (error) {
    console.error('Communities API error:', error);
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}

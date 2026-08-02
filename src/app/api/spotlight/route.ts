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
    const posts = await db.post.findMany({
      where: { postType: { in: ['video', 'spotlight'] } },
      select: {
        id: true, userId: true, content: true, postType: true, mediaUrls: true,
        teamTag: true, playerTag: true, isBreaking: true, likeCount: true,
        commentCount: true, shareCount: true, viewCount: true, createdAt: true,
        user: { select: USER_SELECT },
      },
      orderBy: { likeCount: 'desc' },
      take: 20,
    });

    const parsed = posts.map((post) => ({
      ...post,
      mediaUrls: safeJsonParse(post.mediaUrls, []),
      user: {
        ...post.user,
        roleData: safeJsonParse(post.user.roleData, {}),
        sportsFollowing: safeJsonParse(post.user.sportsFollowing, []),
      },
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Spotlight API error:', error);
    return NextResponse.json({ error: 'Failed to fetch spotlight items' }, { status: 500 });
  }
}


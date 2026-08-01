import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') || 'for-you';
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    let posts;

    switch (type) {
      case 'trending':
        posts = await db.post.findMany({
          where,
          include: {
            user: true,
            poll: true,
          },
          orderBy: { likeCount: 'desc' },
          take: 20,
        });
        break;

      case 'spotlight':
        posts = await db.post.findMany({
          where: {
            ...where,
            postType: { in: ['video', 'spotlight'] },
          },
          include: {
            user: true,
          },
          orderBy: { likeCount: 'desc' },
          take: 20,
        });
        break;

      case 'for-you':
      default:
        posts = await db.post.findMany({
          where,
          include: {
            user: true,
            poll: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
        break;
    }

    // Parse JSON string fields
    const parsed = posts.map((post) => ({
      ...post,
      mediaUrls: JSON.parse(post.mediaUrls),
      ...(post.poll && {
        poll: {
          ...post.poll,
          options: JSON.parse(post.poll.options),
        },
      }),
      user: {
        ...post.user,
        roleData: JSON.parse(post.user.roleData),
        sportsFollowing: JSON.parse(post.user.sportsFollowing),
      },
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}

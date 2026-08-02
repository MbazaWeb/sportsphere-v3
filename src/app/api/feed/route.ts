import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/db-selects';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';


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
          select: {
            id: true,
            userId: true,
            content: true,
            postType: true,
            mediaUrls: true,
            teamTag: true,
            playerTag: true,
            isBreaking: true,
            likeCount: true,
            commentCount: true,
            shareCount: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true,
            user: { select: USER_SELECT },
            poll: true,
            comments: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                userId: true,
                user: { select: USER_SELECT },
              },
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
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
          select: {
            id: true,
            userId: true,
            content: true,
            postType: true,
            mediaUrls: true,
            teamTag: true,
            playerTag: true,
            isBreaking: true,
            likeCount: true,
            commentCount: true,
            shareCount: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true,
            user: { select: USER_SELECT },
            poll: true,
            comments: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                userId: true,
                user: { select: USER_SELECT },
              },
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
          },
          orderBy: { likeCount: 'desc' },
          take: 20,
        });
        break;

      case 'for-you':
      default:
        posts = await db.post.findMany({
          where,
          select: {
            id: true,
            userId: true,
            content: true,
            postType: true,
            mediaUrls: true,
            teamTag: true,
            playerTag: true,
            isBreaking: true,
            likeCount: true,
            commentCount: true,
            shareCount: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true,
            user: { select: USER_SELECT },
            poll: true,
            comments: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                userId: true,
                user: { select: USER_SELECT },
              },
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
        break;
    }

    // Parse JSON string fields with safe fallback
    const parsed = posts.map((post) => ({
      ...post,
      mediaUrls: safeJsonParse(post.mediaUrls, []),
      ...(post.poll && {
        poll: {
          ...post.poll,
          options: safeJsonParse(post.poll.options, []),
        },
      }),
      user: {
        ...post.user,
        roleData: safeJsonParse(post.user.roleData, {}),
        sportsFollowing: safeJsonParse(post.user.sportsFollowing, []),
      },
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}

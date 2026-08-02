import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const USER_SELECT = {
  id: true, name: true, email: true, handle: true, avatarUrl: true,
  avatarInitials: true, role: true, verificationStatus: true, isVerified: true,
  bio: true, location: true, coverGradient: true, followerCount: true,
  followingCount: true, postCount: true, sportsFollowing: true, roleData: true,
  registeredAt: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const comments = await db.comment.findMany({
      where: { postId },
      select: {
        id: true, postId: true, userId: true, content: true, likeCount: true,
        createdAt: true,
        user: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const parsed = comments.map((c) => ({
      ...c,
      user: {
        ...c.user,
        roleData: safeJsonParse(c.user.roleData, {}),
        sportsFollowing: safeJsonParse(c.user.sportsFollowing, []),
      },
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST — create a comment (requires auth, enforced by proxy)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { postId, content } = await request.json();
    if (!postId || !content || !String(content).trim()) {
      return NextResponse.json({ error: 'postId and content are required.' }, { status: 400 });
    }

    const comment = await db.comment.create({
      data: {
        postId: String(postId),
        userId,
        content: String(content).trim(),
      },
      select: {
        id: true, postId: true, userId: true, content: true, likeCount: true,
        createdAt: true,
        user: { select: USER_SELECT },
      },
    });

    // Increment post's comment count
    await db.post.update({
      where: { id: String(postId) },
      data: { commentCount: { increment: 1 } },
    });

    const parsed = {
      ...comment,
      user: {
        ...comment.user,
        roleData: safeJsonParse(comment.user.roleData, {}),
        sportsFollowing: safeJsonParse(comment.user.sportsFollowing, []),
      },
    };

    return NextResponse.json(parsed, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

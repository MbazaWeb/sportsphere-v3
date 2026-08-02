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

// POST — create a new post (requires auth, enforced by proxy)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      content,
      postType = 'post',
      mediaUrls = [],
      teamTag,
      playerTag,
      hashtags = [],
      location,
      isBreaking = false,
      poll,
      prediction,
    } = body as {
      content?: string;
      postType?: string;
      mediaUrls?: string[];
      teamTag?: string;
      playerTag?: string;
      hashtags?: string[];
      location?: string;
      isBreaking?: boolean;
      poll?: { question: string; options: string[] };
      prediction?: { homeTeam: string; awayTeam: string; predictedHome: number; predictedAway: number };
    };

    // Validate
    if (!content || !String(content).trim()) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
    }

    const validPostTypes = ['post', 'photo', 'video', 'spotlight', 'poll', 'prediction', 'highlight'];
    if (!validPostTypes.includes(postType)) {
      return NextResponse.json({ error: 'Invalid post type.' }, { status: 400 });
    }

    // Create the post
    const post = await db.post.create({
      data: {
        userId,
        content: String(content).trim(),
        postType,
        mediaUrls: JSON.stringify(mediaUrls),
        teamTag: teamTag || null,
        playerTag: playerTag || null,
        isBreaking: Boolean(isBreaking),
      },
      select: {
        id: true, userId: true, content: true, postType: true, mediaUrls: true,
        teamTag: true, playerTag: true, isBreaking: true, likeCount: true,
        commentCount: true, shareCount: true, viewCount: true, createdAt: true,
        updatedAt: true,
        user: { select: USER_SELECT },
        poll: true,
        comments: {
          select: { id: true, content: true, createdAt: true, userId: true, user: { select: USER_SELECT } },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    // Create poll if provided
    if (postType === 'poll' && poll && poll.question && poll.options.length >= 2) {
      await db.poll.create({
        data: {
          postId: post.id,
          question: poll.question,
          options: JSON.stringify(poll.options),
        },
      });
    }

    // Create prediction if provided
    if (postType === 'prediction' && prediction) {
      await db.prediction.create({
        data: {
          userId,
          homeTeam: prediction.homeTeam,
          awayTeam: prediction.awayTeam,
          predictedHome: prediction.predictedHome,
          predictedAway: prediction.predictedAway,
        },
      });
    }

    // Increment user's postCount
    await db.user.update({
      where: { id: userId },
      data: { postCount: { increment: 1 } },
    });

    // Re-fetch with poll included
    const fullPost = await db.post.findUnique({
      where: { id: post.id },
      select: {
        id: true, userId: true, content: true, postType: true, mediaUrls: true,
        teamTag: true, playerTag: true, isBreaking: true, likeCount: true,
        commentCount: true, shareCount: true, viewCount: true, createdAt: true,
        updatedAt: true,
        user: { select: USER_SELECT },
        poll: true,
        comments: {
          select: { id: true, content: true, createdAt: true, userId: true, user: { select: USER_SELECT } },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    const parsed = {
      ...fullPost,
      mediaUrls: safeJsonParse(fullPost?.mediaUrls, []),
      ...(fullPost?.poll && {
        poll: { ...fullPost.poll, options: safeJsonParse(fullPost.poll.options, []) },
      }),
      user: fullPost?.user ? {
        ...fullPost.user,
        roleData: safeJsonParse(fullPost.user.roleData, {}),
        sportsFollowing: safeJsonParse(fullPost.user.sportsFollowing, []),
      } : null,
    };

    return NextResponse.json(parsed, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

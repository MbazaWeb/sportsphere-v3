import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/db-selects';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';


// POST — create a new post (requires auth, enforced by proxy)
export async function POST(request: NextRequest) {
  try {
    const userId = (request.headers.get('x-user-id') ?? await getUserIdFromRequest(request));
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
      poll?: { question: string; options: string[]; durationHours?: number };
      prediction?: {
        homeTeam: string;
        awayTeam: string;
        predictedHome: number;
        predictedAway: number;
        confidence?: 'low' | 'medium' | 'high';
      };
    };

    // Validate
    if (!content || !String(content).trim()) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
    }

    const validPostTypes = ['post', 'photo', 'video', 'spotlight', 'poll', 'prediction', 'highlight'];
    if (!validPostTypes.includes(postType)) {
      return NextResponse.json({ error: 'Invalid post type.' }, { status: 400 });
    }

    // For media posts, require at least one media URL
    if ((postType === 'photo' || postType === 'video' || postType === 'spotlight') &&
        (!Array.isArray(mediaUrls) || mediaUrls.length === 0)) {
      return NextResponse.json(
        { error: `${postType === 'photo' ? 'Photo' : 'Video'} is required for this post type.` },
        { status: 400 }
      );
    }

    // For polls, require question + at least 2 options
    if (postType === 'poll' && (!poll?.question?.trim() || (poll?.options?.filter(o => o.trim()).length ?? 0) < 2)) {
      return NextResponse.json(
        { error: 'Poll needs a question and at least 2 options.' },
        { status: 400 }
      );
    }

    // For predictions, require both teams + scores
    if (postType === 'prediction' &&
        (!prediction?.homeTeam?.trim() || !prediction?.awayTeam?.trim() ||
         typeof prediction.predictedHome !== 'number' || typeof prediction.predictedAway !== 'number')) {
      return NextResponse.json(
        { error: 'Prediction needs both teams and predicted scores.' },
        { status: 400 }
      );
    }

    // Create the post (now persists hashtags + location)
    const post = await db.post.create({
      data: {
        userId,
        content: String(content).trim(),
        postType,
        mediaUrls: JSON.stringify(mediaUrls),
        teamTag: teamTag || null,
        playerTag: playerTag || null,
        hashtags: JSON.stringify(Array.isArray(hashtags) ? hashtags : []),
        location: location || null,
        isBreaking: Boolean(isBreaking),
      },
      select: {
        id: true, userId: true, content: true, postType: true, mediaUrls: true,
        teamTag: true, playerTag: true, hashtags: true, location: true, isBreaking: true,
        likeCount: true, commentCount: true, shareCount: true, viewCount: true,
        createdAt: true, updatedAt: true,
        user: { select: USER_SELECT },
        poll: true,
        prediction: true,
        comments: {
          select: { id: true, content: true, createdAt: true, userId: true, user: { select: USER_SELECT } },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    // Create poll if provided — now saves duration (endsAt)
    if (postType === 'poll' && poll && poll.question && poll.options.length >= 2) {
      const durationHours = typeof poll.durationHours === 'number' && poll.durationHours > 0
        ? poll.durationHours
        : 24; // default 24h
      await db.poll.create({
        data: {
          postId: post.id,
          question: poll.question,
          options: JSON.stringify(poll.options),
          endsAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
        },
      });
    }

    // Create prediction if provided — now linked to the post via postId
    if (postType === 'prediction' && prediction) {
      await db.prediction.create({
        data: {
          userId,
          postId: post.id,
          homeTeam: prediction.homeTeam,
          awayTeam: prediction.awayTeam,
          predictedHome: prediction.predictedHome,
          predictedAway: prediction.predictedAway,
          confidence: prediction.confidence || null,
        },
      });
    }

    // Increment user's postCount
    await db.user.update({
      where: { id: userId },
      data: { postCount: { increment: 1 } },
    });

    // Re-fetch with poll + prediction included
    const fullPost = await db.post.findUnique({
      where: { id: post.id },
      select: {
        id: true, userId: true, content: true, postType: true, mediaUrls: true,
        teamTag: true, playerTag: true, hashtags: true, location: true,
        isBreaking: true, likeCount: true,
        commentCount: true, shareCount: true, viewCount: true, createdAt: true,
        updatedAt: true,
        user: { select: USER_SELECT },
        poll: true,
        prediction: true,
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
      hashtags: safeJsonParse(fullPost?.hashtags, []),
      ...(fullPost?.poll && {
        poll: {
          ...fullPost.poll,
          options: safeJsonParse(fullPost.poll.options, []),
          // Newly-created poll — zero votes everywhere, viewer hasn't voted.
          optionCounts: safeJsonParse<string[]>(fullPost.poll.options, []).map(() => 0),
          userVotedOption: null,
        },
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

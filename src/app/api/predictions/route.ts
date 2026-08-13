import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/db-selects';
import { getUserIdFromRequest, serializePublicUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/predictions?limit=20&userId=xxx
// Returns a list of prediction posts with user info and prediction details.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));
    const userId = searchParams.get('userId');

    const viewerId = await getUserIdFromRequest(request);

    // Fetch posts that have a prediction attached
    const where: Record<string, unknown> = {
      prediction: { isNot: null },
    };

    if (userId) {
      where.userId = userId;
    }

    const posts = await db.post.findMany({
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
        hashtags: true,
        likeCount: true,
        commentCount: true,
        shareCount: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        user: { select: USER_SELECT },
        prediction: {
          select: {
            id: true,
            homeTeam: true,
            awayTeam: true,
            predictedHome: true,
            predictedAway: true,
            confidence: true,
            isCorrect: true,
            pointsEarned: true,
            result: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const hydrated = posts.map((post) => ({
      ...post,
      mediaUrls: post.mediaUrls && typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : post.mediaUrls,
      user: serializePublicUser({
        ...post.user,
        email: '',
        roleData: post.user.roleData,
        sportsFollowing: post.user.sportsFollowing,
      } as Parameters<typeof serializePublicUser>[0]),
    }));

    return NextResponse.json(hydrated);
  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  }
}

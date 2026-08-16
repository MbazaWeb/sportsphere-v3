import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/moderation
 *   ?sort=controversial|recent|engagement|reported
 *   ?type=post|prediction|poll|all
 *   Returns posts with engagement stats, sorted for moderation review.
 *
 * "Controversial" = high comment count relative to likes (potential arguments).
 * "Engagement" = total interactions (likes + comments + views).
 * "Reported" = not yet implemented (no Report model) — falls back to controversial.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'controversial';
    const type = searchParams.get('type') || 'all';
    const q = searchParams.get('q')?.trim();

    const where: any = {};
    if (type !== 'all') where.postType = type;
    if (q) where.content = { contains: q, mode: 'insensitive' };

    const posts = await db.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
            avatarInitials: true,
            isVerified: true,
            currentCountry: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Compute a controversy score: comments / (likes + 1)
    // Higher score = more argumentative relative to agreement.
    const scored = posts.map((p) => {
      const likes = p._count.likes;
      const comments = p._count.comments;
      const controversyScore = comments / (likes + 1);
      const engagementScore = likes + comments + p.viewCount;
      return {
        ...p,
        _controversyScore: controversyScore,
        _engagementScore: engagementScore,
      };
    });

    // Sort
    if (sort === 'controversial') {
      scored.sort((a, b) => b._controversyScore - a._controversyScore);
    } else if (sort === 'engagement') {
      scored.sort((a, b) => b._engagementScore - a._engagementScore);
    } else if (sort === 'recent') {
      scored.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sort === 'reported') {
      // No Report model yet — fall back to controversial
      scored.sort((a, b) => b._controversyScore - a._controversyScore);
    }

    // Strip internal score fields before returning
    const result = scored.slice(0, 100).map(({ _controversyScore, _engagementScore, ...p }) => p);

    return NextResponse.json({
      posts: result,
      total: posts.length,
      sort,
      type,
    });
  } catch (error) {
    console.error('Failed to fetch moderation queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue', detail: String(error) },
      { status: 500 }
    );
  }
}

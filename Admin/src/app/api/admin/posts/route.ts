import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/posts?limit=50
 *
 * Direct DB query. Returns the latest posts with author info, ordered
 * newest-first. Used by the content moderation page.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    const posts = await db.post.findMany({
      select: {
        id: true,
        content: true,
        postType: true,
        likeCount: true,
        commentCount: true,
        shareCount: true,
        viewCount: true,
        isBreaking: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
            avatarInitials: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Flatten for the UI
    const result = posts.map((p) => ({
      id: p.id,
      content: p.content,
      postType: p.postType,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      shareCount: p.shareCount,
      viewCount: p.viewCount,
      isBreaking: p.isBreaking,
      createdAt: p.createdAt.toISOString(),
      authorId: p.user.id,
      authorName: p.user.name,
      authorHandle: p.user.handle,
      authorAvatarUrl: p.user.avatarUrl,
      authorAvatarInitials: p.user.avatarInitials,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch admin posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

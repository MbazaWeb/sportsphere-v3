import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST — toggle like on a post (requires auth)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { postId } = await request.json();
    if (!postId) {
      return NextResponse.json({ error: 'postId is required.' }, { status: 400 });
    }

    // Check if already liked
    const existing = await db.postLike.findUnique({
      where: { postId_userId: { postId: String(postId), userId } },
    });

    if (existing) {
      // Unlike
      await db.postLike.delete({ where: { postId_userId: { postId: String(postId), userId } } });
      await db.post.update({
        where: { id: String(postId) },
        data: { likeCount: { decrement: 1 } },
      });
      return NextResponse.json({ liked: false, likeCount: (await db.post.findUnique({ where: { id: String(postId) }, select: { likeCount: true } }))?.likeCount ?? 0 });
    } else {
      // Like
      await db.postLike.create({ data: { postId: String(postId), userId } });
      await db.post.update({
        where: { id: String(postId) },
        data: { likeCount: { increment: 1 } },
      });
      return NextResponse.json({ liked: true, likeCount: (await db.post.findUnique({ where: { id: String(postId) }, select: { likeCount: true } }))?.likeCount ?? 0 });
    }
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}

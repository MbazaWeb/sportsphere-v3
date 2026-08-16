import { realtime } from '@/lib/realtime';
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST — toggle like on a post (requires auth)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
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
      const likeCount = (await db.post.findUnique({ where: { id: String(postId) }, select: { likeCount: true } }))?.likeCount ?? 0;
      try { realtime.likeUpdated(String(postId), { likeCount, liked: false, userId }); } catch {}
      return NextResponse.json({ liked: false, likeCount });
    } else {
      // Like
      await db.postLike.create({ data: { postId: String(postId), userId } });
      await db.post.update({
        where: { id: String(postId) },
        data: { likeCount: { increment: 1 } },
      });
      const likeCount = (await db.post.findUnique({ where: { id: String(postId) }, select: { likeCount: true } }))?.likeCount ?? 0;
      try { realtime.likeUpdated(String(postId), { likeCount, liked: true, userId }); } catch {}
      return NextResponse.json({ liked: true, likeCount });
    }
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST — toggle like on a comment (requires auth)
// Body: { commentId }
// Returns: { liked: boolean, likeCount: number }
export async function POST(request: NextRequest) {
  try {
    const userId =
      request.headers.get('x-user-id') ?? (await getUserIdFromRequest(request));
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 },
      );
    }

    const { commentId } = await request.json();
    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required.' },
        { status: 400 },
      );
    }

    const comment = await db.comment.findUnique({
      where: { id: String(commentId) },
      select: { id: true, likeCount: true },
    });
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found.' },
        { status: 404 },
      );
    }

    const existing = await db.commentLike.findUnique({
      where: { commentId_userId: { commentId: String(commentId), userId } },
    });

    if (existing) {
      // Unlike
      await db.$transaction([
        db.commentLike.delete({
          where: { commentId_userId: { commentId: String(commentId), userId } },
        }),
        db.comment.update({
          where: { id: String(commentId) },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({
        liked: false,
        likeCount: Math.max(0, comment.likeCount - 1),
      });
    }

    // Like
    await db.$transaction([
      db.commentLike.create({
        data: { commentId: String(commentId), userId },
      }),
      db.comment.update({
        where: { id: String(commentId) },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
    return NextResponse.json({
      liked: true,
      likeCount: comment.likeCount + 1,
    });
  } catch (error) {
    console.error('Comment like error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 },
    );
  }
}

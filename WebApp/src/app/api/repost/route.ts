import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { realtime } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { postId, content = '' } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 });
    }

    // Check if original post exists
    const originalPost = await db.post.findUnique({
      where: { id: postId },
      include: { user: { select: { name: true, handle: true } } },
    });

    if (!originalPost) {
      return NextResponse.json({ error: 'Original post not found.' }, { status: 404 });
    }

    // Create the repost
    // We store the original post info in the content or metadata if we had it.
    // For now, let's use postType: "repost" and content: "JSON_DATA"
    const repostData = {
      originalId: originalPost.id,
      originalAuthor: originalPost.user.name,
      originalHandle: originalPost.user.handle,
      originalContent: originalPost.content,
      caption: content,
    };

    const newPost = await db.post.create({
      data: {
        userId,
        content: JSON.stringify(repostData),
        postType: 'repost',
      },
    });

    // Increment original post's share count
    await db.post.update({
      where: { id: postId },
      data: { shareCount: { increment: 1 } },
    });

    // Notify original author
    if (originalPost.userId !== userId) {
      await db.notification.create({
        data: {
          userId: originalPost.userId,
          actorId: userId,
          type: 'repost',
          title: 'New Repost',
          body: `someone reposted your spotlight`,
          referenceId: newPost.id,
        },
      });
    }

    // Realtime update
    try {
      realtime.postCreated({ ...newPost, user: { name: 'You', handle: 'me' } }); // Simplified for now
    } catch {}

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('[repost] Error:', error);
    return NextResponse.json({ error: 'Failed to repost' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/db-selects';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

// ─── Shared shape ──────────────────────────────────────────────
const COMMENT_SELECT = {
  id: true,
  postId: true,
  userId: true,
  parentId: true,
  content: true,
  likeCount: true,
  mentionedUserIds: true,
  createdAt: true,
  user: { select: USER_SELECT },
  replies: {
    select: {
      id: true,
      postId: true,
      userId: true,
      parentId: true,
      content: true,
      likeCount: true,
      mentionedUserIds: true,
      createdAt: true,
      user: { select: USER_SELECT },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

// ─── GET — list comments for a post (threaded) ────────────────
// Returns top-level comments with their replies nested. Also
// returns whether the viewer has liked each comment.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const postId = searchParams.get('postId');
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const viewerId =
      await getUserIdFromRequest(request);

    // Top-level comments only (parentId === null). Replies are nested via `replies`.
    const comments = await db.comment.findMany({
      where: { postId, parentId: null },
      select: COMMENT_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Resolve mentioned user IDs → user objects (one round-trip for the whole set).
    const mentionedIds = new Set<string>();
    for (const c of comments) {
      const ids = safeJsonParse<string[]>(c.mentionedUserIds, []);
      ids.forEach((id) => mentionedIds.add(id));
      for (const r of c.replies) {
        const rids = safeJsonParse<string[]>(r.mentionedUserIds, []);
        rids.forEach((id) => mentionedIds.add(id));
      }
    }

    const mentionedUsers = mentionedIds.size
      ? await db.user.findMany({
          where: { id: { in: Array.from(mentionedIds) } },
          select: { id: true, name: true, handle: true, avatarInitials: true, isVerified: true },
        })
      : [];

    const mentionMap = new Map(mentionedUsers.map((u: typeof mentionedUsers[number]) => [u.id, u]));

    // Fetch the viewer's likes for these comments (top-level + replies) in one query.
    const allCommentIds = new Set<string>();
    for (const c of comments) {
      allCommentIds.add(c.id);
      c.replies.forEach((r: typeof c.replies[number]) => allCommentIds.add(r.id));
    }
    const viewerLikes = viewerId
      ? await db.commentLike.findMany({
          where: { commentId: { in: Array.from(allCommentIds) }, userId: viewerId },
          select: { commentId: true },
        })
      : [];
    const likedSet = new Set(viewerLikes.map((l: typeof viewerLikes[number]) => l.commentId));

    // Build the response shape — flatten the JSON-string fields and attach
    // `viewerLiked` boolean + resolved mentioned users to every comment.
    const parseComment = (
      c: typeof comments[number],
    ) => {
      const ids = safeJsonParse<string[]>(c.mentionedUserIds, []);
      return {
        ...c,
        mentionedUserIds: ids,
        mentionedUsers: ids.map((id) => mentionMap.get(id)).filter(Boolean),
        viewerLiked: likedSet.has(c.id),
        replies: c.replies.map((r: typeof c.replies[number]) => {
          const rids = safeJsonParse<string[]>(r.mentionedUserIds, []);
          return {
            ...r,
            mentionedUserIds: rids,
            mentionedUsers: rids.map((id) => mentionMap.get(id)).filter(Boolean),
            viewerLiked: likedSet.has(r.id),
          };
        }),
      };
    };

    const parsed = comments.map(parseComment).map((c: ReturnType<typeof parseComment>) => ({
      ...c,
      user: {
        ...c.user,
        roleData: safeJsonParse(c.user.roleData, {}),
        sportsFollowing: safeJsonParse(c.user.sportsFollowing, []),
      },
      replies: c.replies.map((r: ReturnType<typeof parseComment>['replies'][number]) => ({
        ...r,
        user: {
          ...r.user,
          roleData: safeJsonParse(r.user.roleData, {}),
          sportsFollowing: safeJsonParse(r.user.sportsFollowing, []),
        },
      })),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// ─── POST — create a comment or reply ─────────────────────────
// Body: { postId, content, parentId?, mentionedUserIds?: string[] }
//
// If parentId is provided, the comment is created as a reply to that
// comment (must belong to the same post).
export async function POST(request: NextRequest) {
  try {
    const userId =
      await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, content, parentId, mentionedUserIds } = body as {
      postId?: string;
      content?: string;
      parentId?: string | null;
      mentionedUserIds?: string[];
    };

    if (!postId || !content || !String(content).trim()) {
      return NextResponse.json(
        { error: 'postId and content are required.' },
        { status: 400 },
      );
    }

    // Validate parentId if provided — must exist and belong to the same post.
    if (parentId) {
      const parent = await db.comment.findUnique({
        where: { id: String(parentId) },
        select: { id: true, postId: true },
      });
      if (!parent || parent.postId !== String(postId)) {
        return NextResponse.json(
          { error: 'Parent comment not found for this post.' },
          { status: 400 },
        );
      }
    }

    // Sanitize mentioned user IDs. The client may send @handle tokens
    // (from the textarea) — resolve those to user IDs.
    let cleanMentions: string[] = [];
    if (Array.isArray(mentionedUserIds) && mentionedUserIds.length) {
      const tokens = mentionedUserIds.map(String).filter(Boolean).slice(0, 10);
      // Tokens that start with '@' are handle tokens (e.g. "@john_doe").
      // The DB stores handles WITH the leading '@' (see auth/register route),
      // so the token as typed matches the stored handle directly.
      const handleTokens = tokens.filter((t) => t.startsWith('@'));
      const idTokens = tokens.filter((t) => !t.startsWith('@'));

      if (handleTokens.length) {
        const byIn = await db.user.findMany({
          where: { handle: { in: handleTokens } },
          select: { id: true, handle: true },
        });
        // Lowercased fallback in case Postgres collation differs.
        const lowerToId = new Map(byIn.map((u: typeof byIn[number]) => [u.handle.toLowerCase(), u.id]));
        for (const h of handleTokens) {
          const id = lowerToId.get(h.toLowerCase());
          if (id) idTokens.push(id as string);
        }
      }
      cleanMentions = Array.from(new Set(idTokens));
    }

    const comment = await db.comment.create({
      data: {
        postId: String(postId),
        userId,
        parentId: parentId ? String(parentId) : null,
        content: String(content).trim(),
        mentionedUserIds: JSON.stringify(cleanMentions),
      },
      select: {
        id: true,
        postId: true,
        userId: true,
        parentId: true,
        content: true,
        likeCount: true,
        mentionedUserIds: true,
        createdAt: true,
        user: { select: USER_SELECT },
      },
    });

    // Increment post's comment count (counts top-level + replies — both are "comments" UX-wise)
    await db.post.update({
      where: { id: String(postId) },
      data: { commentCount: { increment: 1 } },
    });

    const parsed = {
      ...comment,
      mentionedUserIds: safeJsonParse(comment.mentionedUserIds, []),
      mentionedUsers: [],
      viewerLiked: false,
      replies: [],
      user: {
        ...comment.user,
        roleData: safeJsonParse(comment.user.roleData as string, {}),
        sportsFollowing: safeJsonParse(comment.user.sportsFollowing, []),
      },
    };

    return NextResponse.json(parsed, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

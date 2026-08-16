import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/db-selects';
import { safeJsonParse } from '@/lib/json';
import { getUserIdFromRequest, serializePublicUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Shared post select — keeps the three branches identical.
const POST_SELECT = {
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
  poll: true,
  prediction: true,
  comments: {
    select: {
      id: true,
      content: true,
      createdAt: true,
      userId: true,
      user: { select: USER_SELECT },
    },
    orderBy: { createdAt: 'desc' as const },
    take: 3,
  },
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') || 'for-you';
    const userId = searchParams.get('userId');

    // Resolve the current viewer (if any) so we can return their vote
    // state and per-option counts in one round-trip.
    const viewerId =
      await getUserIdFromRequest(request);

    const where: Record<string, unknown> = {};

    const q = searchParams.get('q')?.trim();
    if (q) {
      where.content = { contains: q, mode: 'insensitive' };
    }

    if (userId) {
      where.userId = userId;
    }

    let posts;

    switch (type) {
      case 'trending':
        posts = await db.post.findMany({
          where,
          select: POST_SELECT,
          orderBy: { likeCount: 'desc' },
          take: 20,
        });
        break;

      case 'spotlight':
        posts = await db.post.findMany({
          where: { ...where, postType: { in: ['video', 'spotlight'] } },
          select: POST_SELECT,
          orderBy: { likeCount: 'desc' },
          take: 20,
        });
        break;

      case 'for-you':
      default:
        posts = await db.post.findMany({
          where,
          select: POST_SELECT,
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
        break;
    }

    // ─── Hydrate polls with per-option counts + viewer's vote ────────
    const pollIds = posts
      .map((p: typeof posts[number]) => p.poll?.id)
      .filter((id: string | undefined): id is string => !!id);

    // Single findMany fetches ALL vote rows for these polls.
    // From those we derive per-poll option counts and the viewer's choice.
    const [allVotes, viewerVotes] = await Promise.all([
      pollIds.length
        ? db.pollVote.findMany({
            where: { pollId: { in: pollIds } },
            select: { pollId: true, optionIdx: true, userId: true },
          })
        : Promise.resolve([]),
      pollIds.length && viewerId
        ? db.pollVote.findMany({
            where: { pollId: { in: pollIds }, userId: viewerId },
            select: { pollId: true, optionIdx: true },
          })
        : Promise.resolve([]),
    ]);

    // Map pollId -> { optionIdx -> count }
    const countsByPoll = new Map<string, Record<number, number>>();
    for (const r of allVotes) {
      const bucket = countsByPoll.get(r.pollId) ?? {};
      bucket[r.optionIdx] = (bucket[r.optionIdx] ?? 0) + 1;
      countsByPoll.set(r.pollId, bucket);
    }

    const viewerVoteByPoll = new Map<string, number>();
    for (const v of viewerVotes) viewerVoteByPoll.set(v.pollId, v.optionIdx);

    // Parse JSON string fields with safe fallback
    const parsed = posts.map((post: typeof posts[number]) => {
      const options = post.poll
        ? safeJsonParse<string[]>(post.poll.options, [])
        : [];

      const optionCounts = post.poll
        ? options.map((_, i) => countsByPoll.get(post.poll!.id)?.[i] ?? 0)
        : [];

      const userVotedOption = post.poll
        ? viewerVoteByPoll.get(post.poll.id) ?? null
        : null;

      return {
        ...post,
        mediaUrls: safeJsonParse(post.mediaUrls, []),
        ...(post.poll && {
          poll: {
            ...post.poll,
            options,
            optionCounts,
            userVotedOption,
          },
        }),
        ...(post.prediction && {
          prediction: { ...post.prediction },
        }),
        user: serializePublicUser({
          ...post.user,
          // serializePublicUser type expects email; never persist it in the response
          email: '',
          roleData: post.user.roleData,
          sportsFollowing: post.user.sportsFollowing,
        } as Parameters<typeof serializePublicUser>[0]),
      };
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/db-selects';
import { getUserIdFromRequest, serializePublicUser } from '@/lib/auth';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

// GET /api/polls?limit=20
// Returns a list of poll posts with user info, options, and per-option vote counts.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

    const viewerId = await getUserIdFromRequest(request);

    // Fetch posts that have a poll attached
    const posts = await db.post.findMany({
      where: { poll: { isNot: null } },
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
        poll: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Hydrate polls with per-option counts and viewer vote
    const pollIds = posts.map((p) => p.poll?.id).filter((id): id is string => !!id);

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

    const hydrated = posts.map((post) => {
      const options = post.poll ? safeJsonParse<string[]>(post.poll.options, []) : [];
      const optionCounts = post.poll
        ? options.map((_, i) => countsByPoll.get(post.poll!.id)?.[i] ?? 0)
        : [];
      const userVotedOption = post.poll
        ? viewerVoteByPoll.get(post.poll.id) ?? null
        : null;

      return {
        ...post,
        mediaUrls: post.mediaUrls && typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : post.mediaUrls,
        poll: post.poll
          ? {
              ...post.poll,
              options,
              optionCounts,
              userVotedOption,
            }
          : null,
        user: serializePublicUser({
          ...post.user,
          email: '',
          roleData: post.user.roleData,
          sportsFollowing: post.user.sportsFollowing,
        } as Parameters<typeof serializePublicUser>[0]),
      };
    });

    return NextResponse.json(hydrated);
  } catch (error) {
    console.error('Polls API error:', error);
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
  }
}

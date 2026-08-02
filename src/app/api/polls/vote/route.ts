import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

// POST — vote on a poll (requires auth)
// Body: { pollId, optionIndex }
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { pollId, optionIndex } = await request.json();
    if (!pollId || optionIndex === undefined || optionIndex === null) {
      return NextResponse.json({ error: 'pollId and optionIndex are required.' }, { status: 400 });
    }

    const poll = await db.poll.findUnique({ where: { id: String(pollId) } });
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found.' }, { status: 404 });
    }

    const options = safeJsonParse<string[]>(poll.options, []);
    if (optionIndex < 0 || optionIndex >= options.length) {
      return NextResponse.json({ error: 'Invalid option index.' }, { status: 400 });
    }

    // Check if user already voted (PollVote has @@unique([pollId, userId]))
    const existingVote = await db.pollVote.findUnique({
      where: { pollId_userId: { pollId: poll.id, userId } },
    });
    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted on this poll.' }, { status: 409 });
    }

    // Create the vote record and increment total votes in a transaction
    const [_, updated] = await db.$transaction([
      db.pollVote.create({
        data: { pollId: poll.id, userId, optionIdx: Number(optionIndex) },
      }),
      db.poll.update({
        where: { id: poll.id },
        data: { totalVotes: { increment: 1 } },
      }),
    ]);
    return NextResponse.json({
      ok: true,
      totalVotes: updated?.totalVotes ?? 0,
      optionIndex,
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

// ─── POST — vote (or change vote) on a poll ────────────────────
// Body: { pollId, optionIndex }
//
// Behaviour:
//   • No existing vote      → create vote, increment totalVotes
//   • Existing, same option → no-op (idempotent)
//   • Existing, new option  → update optionIdx, totalVotes unchanged
//
// Returns: { ok, totalVotes, optionIndex, changed }
export async function POST(request: NextRequest) {
  try {
    const userId =
      request.headers.get('x-user-id') ?? (await getUserIdFromRequest(request));
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { pollId, optionIndex } = await request.json();
    if (!pollId || optionIndex === undefined || optionIndex === null) {
      return NextResponse.json(
        { error: 'pollId and optionIndex are required.' },
        { status: 400 }
      );
    }

    const poll = await db.poll.findUnique({ where: { id: String(pollId) } });
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found.' }, { status: 404 });
    }

    const options = safeJsonParse<string[]>(poll.options, []);
    const idx = Number(optionIndex);
    if (idx < 0 || idx >= options.length) {
      return NextResponse.json(
        { error: 'Invalid option index.' },
        { status: 400 }
      );
    }

    // Poll closed? — refuse new votes, but allow changing existing ones? No — once closed, lock.
    if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
      return NextResponse.json(
        { error: 'This poll has closed.' },
        { status: 410 }
      );
    }

    const existing = await db.pollVote.findUnique({
      where: { pollId_userId: { pollId: poll.id, userId } },
    });

    // Idempotent — clicking the same option again is a no-op.
    if (existing && existing.optionIdx === idx) {
      return NextResponse.json({
        ok: true,
        totalVotes: poll.totalVotes,
        optionIndex: idx,
        changed: false,
      });
    }

    if (existing) {
      // Change vote — keep totalVotes the same.
      await db.pollVote.update({
        where: { id: existing.id },
        data: { optionIdx: idx },
      });
      return NextResponse.json({
        ok: true,
        totalVotes: poll.totalVotes,
        optionIndex: idx,
        changed: true,
      });
    }

    // First-time vote — create + increment counter.
    await db.$transaction([
      db.pollVote.create({
        data: { pollId: poll.id, userId, optionIdx: idx },
      }),
      db.poll.update({
        where: { id: poll.id },
        data: { totalVotes: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      totalVotes: poll.totalVotes + 1,
      optionIndex: idx,
      changed: true,
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}

// ─── DELETE — remove user's vote on a poll ─────────────────────
// Body: { pollId }
// Allows the user to "unvote" entirely. Idempotent.
export async function DELETE(request: NextRequest) {
  try {
    const userId =
      request.headers.get('x-user-id') ?? (await getUserIdFromRequest(request));
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const pollId = body?.pollId;
    if (!pollId) {
      return NextResponse.json(
        { error: 'pollId is required.' },
        { status: 400 }
      );
    }

    const poll = await db.poll.findUnique({ where: { id: String(pollId) } });
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found.' }, { status: 404 });
    }

    if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
      return NextResponse.json(
        { error: 'This poll has closed.' },
        { status: 410 }
      );
    }

    const existing = await db.pollVote.findUnique({
      where: { pollId_userId: { pollId: poll.id, userId } },
    });

    if (!existing) {
      return NextResponse.json({
        ok: true,
        totalVotes: poll.totalVotes,
        optionIndex: null,
        changed: false,
      });
    }

    await db.$transaction([
      db.pollVote.delete({ where: { id: existing.id } }),
      db.poll.update({
        where: { id: poll.id },
        data: { totalVotes: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      totalVotes: Math.max(0, poll.totalVotes - 1),
      optionIndex: null,
      changed: true,
    });
  } catch (error) {
    console.error('Unvote error:', error);
    return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: communityId } = await context.params;
  if (!communityId) {
    return NextResponse.json({ error: 'Community id required' }, { status: 400 });
  }

  try {
    const existing = await db.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!existing) {
      return NextResponse.json({ ok: true, alreadyLeft: true });
    }

    await db.$transaction([
      db.communityMember.delete({
        where: { communityId_userId: { communityId, userId } },
      }),
      db.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ ok: true, left: true });
  } catch (e) {
    console.error('community leave error:', e);
    return NextResponse.json({ error: 'Failed to leave community' }, { status: 500 });
  }
}

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
    const community = await db.community.findUnique({ where: { id: communityId } });
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const existing = await db.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (existing) {
      return NextResponse.json({ ok: true, alreadyMember: true });
    }

    await db.$transaction([
      db.communityMember.create({
        data: { communityId, userId, role: 'member' },
      }),
      db.community.update({
        where: { id: communityId },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ ok: true, joined: true });
  } catch (e) {
    console.error('community join error:', e);
    return NextResponse.json({ error: 'Failed to join community' }, { status: 500 });
  }
}

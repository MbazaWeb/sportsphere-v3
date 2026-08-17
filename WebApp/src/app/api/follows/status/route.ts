import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/follows/status?targetUserId=xxx
// Returns { following: bool, isFan: bool }
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request).catch(() => null);
    if (!userId) return NextResponse.json({ following: false, isFan: false });

    const targetUserId = request.nextUrl.searchParams.get('targetUserId');
    if (!targetUserId) return NextResponse.json({ following: false, isFan: false });

    const follow = await db.follow.findFirst({
      where: { followerId: userId, followingId: targetUserId },
      select: { kind: true },
    });

    return NextResponse.json({
      following: !!follow,
      isFan: follow?.kind === 'fan',
    });
  } catch {
    return NextResponse.json({ following: false, isFan: false });
  }
}

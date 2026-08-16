import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';
import { USER_SELECT } from '@/lib/db-selects';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    const communities = await db.community.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        topic: true,
        memberCount: true,
        createdById: true,
        createdAt: true,
        createdBy: { select: USER_SELECT },
      },
      orderBy: { memberCount: 'desc' },
      take: 50,
    });

    let memberIds = new Set<string>();
    if (userId) {
      const memberships = await db.communityMember.findMany({
        where: { userId, communityId: { in: communities.map((c) => c.id) } },
        select: { communityId: true },
      });
      memberIds = new Set(memberships.map((m) => m.communityId));
    }

    return NextResponse.json(
      communities.map((c: (typeof communities)[number]) => ({
        ...c,
        isMember: memberIds.has(c.id),
        createdBy: c.createdBy
          ? {
              ...c.createdBy,
              sportsFollowing: safeJsonParse(c.createdBy.sportsFollowing, []),
              roleData: safeJsonParse(c.createdBy.roleData, {}),
            }
          : null,
      })),
    );
  } catch (error) {
    console.error('Communities API error:', error);
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}

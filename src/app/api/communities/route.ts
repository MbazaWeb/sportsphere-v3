import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';
import { USER_SELECT } from '@/lib/db-selects';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const communities = await db.community.findMany({
      select: {
        id: true, name: true, description: true, topic: true,
        memberCount: true, createdById: true, createdAt: true,
        createdBy: { select: USER_SELECT },
      },
      orderBy: { memberCount: 'desc' },
      take: 20,
    });

    return NextResponse.json(communities.map((c: typeof communities[number]) => ({
      ...c,
      createdBy: c.createdBy ? {
        ...c.createdBy,
        sportsFollowing: safeJsonParse(c.createdBy.sportsFollowing, []),
        roleData: safeJsonParse(c.createdBy.roleData, {}),
      } : null,
    })));
  } catch (error) {
    console.error('Communities API error:', error);
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}

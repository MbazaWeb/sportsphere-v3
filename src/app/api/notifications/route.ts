import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';
import { USER_SELECT } from '@/lib/db-selects';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const targetUserId = await getUserIdFromRequest(request);

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const notifications = await db.notification.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        isRead: true,
        referenceId: true,
        createdAt: true,
        actor: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json(notifications.map((n: typeof notifications[number]) => ({
      ...n,
      actor: n.actor ? {
        ...n.actor,
        sportsFollowing: safeJsonParse(n.actor.sportsFollowing, []),
        roleData: safeJsonParse(n.actor.roleData, {}),
      } : null,
    })));
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

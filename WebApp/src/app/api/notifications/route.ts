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

// POST — mark notifications as read (all, or single by id)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const id = body?.id as string | undefined;

    if (id) {
      // Mark single notification as read
      await db.notification.updateMany({
        where: { id, userId },
        data: { isRead: true },
      });
    } else {
      // Mark all notifications as read
      await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json({ error: 'Failed to mark notifications' }, { status: 500 });
  }
}

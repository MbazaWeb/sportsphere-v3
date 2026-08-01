import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    // Default to david's user id from seed
    let targetUserId = userId || undefined;

    if (!targetUserId) {
      // Try to find david's user
      const david = await db.user.findUnique({ where: { handle: '@davidmbaza' } });
      targetUserId = david?.id;
    }

    if (!targetUserId) {
      return NextResponse.json([]);
    }

    const notifications = await db.notification.findMany({
      where: { userId: targetUserId },
      include: {
        actor: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

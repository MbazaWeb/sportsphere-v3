import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { sendNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/notifications/broadcast
 * Send a notification to ALL users or a subset (e.g. by role).
 * Body: { title, body, role?: string }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { title, body, role } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 });
    }

    const where: any = {};
    if (role) where.role = role;

    const users = await db.user.findMany({
      where,
      select: { id: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found matching the criteria.' }, { status: 404 });
    }

    // Send notifications in batches to avoid overwhelming the server/DB
    const batchSize = 50;
    let sentCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(batch.map(user =>
        sendNotification({
          userId: user.id,
          type: 'system',
          title,
          body,
          actorId: (auth.user as any).sub,
        }).catch(err => console.error(`Failed to send broadcast to ${user.id}:`, err))
      ));
      sentCount += batch.length;
    }

    // Audit log
    await db.auditLog.create({
      data: {
        actorId: (auth.user as any).sub,
        action: 'notifications.broadcast',
        module: 'notifications',
        newValue: { title, body, role, targetCount: users.length } as any,
      },
    });

    return NextResponse.json({ ok: true, sentCount });
  } catch (error) {
    console.error('Broadcast failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

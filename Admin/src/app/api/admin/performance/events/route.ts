import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { sendNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/performance/events
 * Lists performance events for review.
 * ?status=pending|verified|rejected
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const events = await db.performanceEvent.findMany({
      where: { verificationStatus: status },
      include: {
        user: { select: { id: true, name: true, handle: true, role: true } },
      },
      orderBy: { matchDate: 'desc' },
      take: 100,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/performance/events
 * Approve or reject a performance event.
 * Body: { eventId, action: 'approve' | 'reject', notes? }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { eventId, action, notes } = await request.json();

    if (!eventId || !action) {
      return NextResponse.json({ error: 'eventId and action are required' }, { status: 400 });
    }

    const event = await db.performanceEvent.findUnique({
      where: { id: eventId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'verified' : 'rejected';

    const updatedEvent = await db.$transaction(async (tx) => {
      const updated = await tx.performanceEvent.update({
        where: { id: eventId },
        data: {
          verificationStatus: newStatus,
          verifiedAt: action === 'approve' ? new Date() : null,
          verifiedBy: (auth.user as any).sub,
          notes: notes || event.notes,
        },
      });

      if (action === 'approve') {
        // Create point transaction
        const currentProfile = await tx.performanceProfile.findUnique({
          where: { userId: event.userId },
        });

        const balanceBefore = currentProfile?.totalPoints ?? 0;
        const balanceAfter = balanceBefore + event.pointsCalculated;

        await tx.performancePointTransaction.create({
          data: {
            id: randomUUID(),
            userId: event.userId,
            eventId: event.id,
            transactionType: 'event',
            amount: event.pointsCalculated,
            balanceBefore,
            balanceAfter,
            reason: `Verified: ${event.eventType}`,
            reasonCode: event.eventType,
            verified: true,
          },
        });

        // Create PerformanceVerification record
        await tx.performanceVerification.upsert({
          where: { eventId },
          create: {
            eventId,
            userId: event.userId,
            verifierRole: 'admin',
            verifierUserId: (auth.user as any).sub,
            status: 'approved',
            notes,
          },
          update: {
            status: 'approved',
            notes,
          }
        });
      }

      return updated;
    });

    // Notify user
    if (action === 'approve') {
      sendNotification({
        userId: event.userId,
        type: 'performance',
        title: 'Performance Verified!',
        body: `Your event "${event.eventType}" has been verified. You earned ${event.pointsCalculated} points.`,
        referenceId: event.id,
      }).catch(err => console.error('Failed to send verification notification:', err));
    } else {
       sendNotification({
        userId: event.userId,
        type: 'performance',
        title: 'Performance Review',
        body: `Your event "${event.eventType}" was not verified. Reason: ${notes || 'Insufficient proof.'}`,
        referenceId: event.id,
      }).catch(err => console.error('Failed to send rejection notification:', err));
    }

    // Audit log
    await db.auditLog.create({
      data: {
        actorId: (auth.user as any).sub,
        action: `performance_event.${action}`,
        module: 'performance',
        targetId: eventId,
        targetType: 'PerformanceEvent',
        newValue: { status: newStatus, notes } as any,
      },
    });

    return NextResponse.json({ ok: true, event: updatedEvent });
  } catch (error: any) {
    console.error('Action failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

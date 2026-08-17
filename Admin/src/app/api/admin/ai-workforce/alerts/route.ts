import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/alerts
 * List alerts sorted by createdAt desc.
 * Query params: ?isRead=false&severity=
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const isReadParam = searchParams.get('isRead');
    const severity = searchParams.get('severity') || undefined;

    const where: Record<string, unknown> = {};
    if (isReadParam !== null) {
      where.isRead = isReadParam === 'true';
    }
    if (severity) where.severity = severity;

    const alerts = await db.aIAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Count unread
    const unreadCount = await db.aIAlert.count({
      where: { isRead: false },
    });

    return NextResponse.json({ data: alerts, unreadCount });
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts', detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/ai-workforce/alerts
 * Mark alert as read/resolved.
 * Body: { id: string, isRead?: boolean, isResolved?: boolean }
 */
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const id = String(body.id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await db.aIAlert.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (body.isRead !== undefined) updates.isRead = Boolean(body.isRead);
    if (body.isResolved !== undefined) {
      updates.isResolved = Boolean(body.isResolved);
      if (body.isResolved) {
        updates.resolvedById = auth.user.sub;
        updates.resolvedAt = new Date();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const alert = await db.aIAlert.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ data: alert });
  } catch (error) {
    console.error('Failed to update alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert', detail: String(error) },
      { status: 500 }
    );
  }
}

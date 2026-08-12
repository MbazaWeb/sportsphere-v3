import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const rumor = await db.rumor.findUnique({
      where: { id },
      include: {
        Sport: { select: { id: true, name: true, icon: true } },
        League: { select: { id: true, name: true } },
        Team: { select: { id: true, name: true } },
        Player: { select: { id: true, name: true } },
        Coach: { select: { id: true, name: true } },
      },
    });
    if (!rumor) {
      return NextResponse.json({ error: 'Rumor not found' }, { status: 404 });
    }
    return NextResponse.json(rumor);
  } catch (error) {
    console.error('Failed to fetch rumor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rumor', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const existing = await db.rumor.findUnique({
      where: { id },
      select: {
        id: true, title: true, status: true, publishedAt: true,
        credibility: true, body: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Rumor not found' }, { status: 404 });
    }

    const allowed = [
      'title', 'body', 'credibility', 'tags', 'status',
      'sportId', 'leagueId', 'teamId', 'playerId', 'coachId',
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) {
        if (key === 'credibility' && typeof body[key] === 'number') {
          data[key] = Math.max(0, Math.min(100, Math.round(body[key] as number)));
        } else {
          data[key] = body[key];
        }
      }
    }

    // Auto-set publishedAt when status changes to 'published' and was null
    if (data.status === 'published' && !existing.publishedAt) {
      data.publishedAt = new Date();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const updated = await db.rumor.update({ where: { id }, data });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'rumor.update',
        module: 'rumors',
        targetId: id,
        targetType: 'Rumor',
        oldValue: existing as any,
        newValue: data as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update rumor:', error);
    return NextResponse.json(
      { error: 'Failed to update rumor', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.rumor.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Rumor not found' }, { status: 404 });
    }

    await db.rumor.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'rumor.delete',
        module: 'rumors',
        targetId: id,
        targetType: 'Rumor',
        oldValue: existing as any,
      },
    });

    return NextResponse.json({ ok: true, deleted: id });
  } catch (error) {
    console.error('Failed to delete rumor:', error);
    return NextResponse.json(
      { error: 'Failed to delete rumor', detail: String(error) },
      { status: 500 }
    );
  }
}

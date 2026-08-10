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
    const league = await db.league.findUnique({
      where: { id },
      include: {
        sport: { select: { id: true, name: true, icon: true } },
        teams: { take: 30, select: { id: true, name: true, logoUrl: true } },
      },
    });
    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }
    return NextResponse.json(league);
  } catch (error) {
    console.error('Failed to fetch league:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league', detail: String(error) },
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

    const existing = await db.league.findUnique({
      where: { id },
      select: { id: true, name: true, country: true, type: true, verified: true, createdByAI: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    const allowed = ['name', 'country', 'type', 'verified', 'createdByAI', 'logoUrl', 'description', 'season'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const updated = await db.league.update({ where: { id }, data });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'league.update',
        module: 'sports-data',
        targetId: id,
        targetType: 'League',
        oldValue: existing as any,
        newValue: data as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update league:', error);
    return NextResponse.json(
      { error: 'Failed to update league', detail: String(error) },
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
    const existing = await db.league.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    await db.league.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'league.delete',
        module: 'sports-data',
        targetId: id,
        targetType: 'League',
        oldValue: existing as any,
      },
    });

    return NextResponse.json({ ok: true, deleted: id });
  } catch (error) {
    console.error('Failed to delete league:', error);
    return NextResponse.json(
      { error: 'Failed to delete league', detail: String(error) },
      { status: 500 }
    );
  }
}

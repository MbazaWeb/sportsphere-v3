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
    const player = await db.player.findUnique({
      where: { id },
      include: {
        Team: { select: { id: true, name: true, logoUrl: true } },
        League: { select: { id: true, name: true } },
        Sport: { select: { id: true, name: true, icon: true } },
      },
    });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    let claimedBy = null;
    if (player.claimedById) {
      claimedBy = await db.user.findUnique({
        where: { id: player.claimedById },
        select: { id: true, name: true, handle: true, email: true },
      });
    }
    return NextResponse.json({ ...player, claimedBy });
  } catch (error) {
    console.error('Failed to fetch player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player', detail: String(error) },
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

    const existing = await db.player.findUnique({
      where: { id },
      select: { id: true, name: true, nationality: true, position: true, verified: true, createdByAI: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const allowed = [
      'name', 'nationality', 'position', 'verified', 'createdByAI',
      'photoUrl', 'shirtNumber', 'heightCm', 'weightKg', 'teamId',
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const updated = await db.player.update({ where: { id }, data });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'player.update',
        module: 'sports-data',
        targetId: id,
        targetType: 'Player',
        oldValue: existing as any,
        newValue: data as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update player:', error);
    return NextResponse.json(
      { error: 'Failed to update player', detail: String(error) },
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
    const existing = await db.player.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    await db.player.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'player.delete',
        module: 'sports-data',
        targetId: id,
        targetType: 'Player',
        oldValue: existing as any,
      },
    });

    return NextResponse.json({ ok: true, deleted: id });
  } catch (error) {
    console.error('Failed to delete player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player', detail: String(error) },
      { status: 500 }
    );
  }
}

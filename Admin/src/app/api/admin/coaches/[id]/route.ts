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
    const coach = await db.coach.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true, logoUrl: true } },
        league: { select: { id: true, name: true } },
        sport: { select: { id: true, name: true, icon: true } },
      },
    });
    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    let claimedBy = null;
    if (coach.claimedById) {
      claimedBy = await db.user.findUnique({
        where: { id: coach.claimedById },
        select: { id: true, name: true, handle: true, email: true },
      });
    }
    return NextResponse.json({ ...coach, claimedBy });
  } catch (error) {
    console.error('Failed to fetch coach:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach', detail: String(error) },
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

    const existing = await db.coach.findUnique({
      where: { id },
      select: { id: true, name: true, nationality: true, role: true, verified: true, createdByAI: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    const allowed = ['name', 'nationality', 'role', 'verified', 'createdByAI', 'photoUrl', 'teamId'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const updated = await db.coach.update({ where: { id }, data });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'coach.update',
        module: 'sports-data',
        targetId: id,
        targetType: 'Coach',
        oldValue: existing as any,
        newValue: data as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update coach:', error);
    return NextResponse.json(
      { error: 'Failed to update coach', detail: String(error) },
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
    const existing = await db.coach.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    await db.coach.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'coach.delete',
        module: 'sports-data',
        targetId: id,
        targetType: 'Coach',
        oldValue: existing as any,
      },
    });

    return NextResponse.json({ ok: true, deleted: id });
  } catch (error) {
    console.error('Failed to delete coach:', error);
    return NextResponse.json(
      { error: 'Failed to delete coach', detail: String(error) },
      { status: 500 }
    );
  }
}

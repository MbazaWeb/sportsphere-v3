import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/teams/[id]
 *   Full detail of a single team.
 *
 * PATCH /api/admin/teams/[id]
 *   Body: partial { name, country, venue, verified, createdByAI, city, foundedYear, logoUrl }
 *
 * DELETE /api/admin/teams/[id]
 *   Removes the team. Logs to AuditLog.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const team = await db.team.findUnique({
      where: { id },
      include: {
        League: { select: { id: true, name: true, country: true } },
        Sport: { select: { id: true, name: true, icon: true } },
        players: { take: 50, select: { id: true, name: true, position: true, photoUrl: true } },
        coaches: { take: 10, select: { id: true, name: true, role: true } },
      },
    });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    let claimedBy = null;
    if (team.claimedById) {
      claimedBy = await db.user.findUnique({
        where: { id: team.claimedById },
        select: { id: true, name: true, handle: true, email: true },
      });
    }

    return NextResponse.json({ ...team, claimedBy });
  } catch (error) {
    console.error('Failed to fetch team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team', detail: String(error) },
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

    const existing = await db.team.findUnique({
      where: { id },
      select: { id: true, name: true, country: true, venue: true, verified: true, createdByAI: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const allowed = ['name', 'country', 'venue', 'verified', 'createdByAI', 'city', 'foundedYear', 'logoUrl'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const updated = await db.team.update({ where: { id }, data });

    // Audit log
    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'team.update',
        module: 'sports-data',
        targetId: id,
        targetType: 'Team',
        oldValue: existing as any,
        newValue: data as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update team:', error);
    return NextResponse.json(
      { error: 'Failed to update team', detail: String(error) },
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

    const existing = await db.team.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    await db.team.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'team.delete',
        module: 'sports-data',
        targetId: id,
        targetType: 'Team',
        oldValue: existing as any,
      },
    });

    return NextResponse.json({ ok: true, deleted: id });
  } catch (error) {
    console.error('Failed to delete team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team', detail: String(error) },
      { status: 500 }
    );
  }
}

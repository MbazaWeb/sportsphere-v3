import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/sports/[id]
 *   Body: partial sport fields. Updates the sport.
 *   Special: { displayOrder: N } to reorder; { isActive: bool } to toggle.
 *
 * DELETE /api/admin/sports/[id]
 *   Removes the sport. Cascades to UserSport (followers) — but only the
 *   association, not the users themselves.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    // Validate that the sport exists
    const existing = await db.sport.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Sport not found.' }, { status: 404 });
    }

    // Build the update payload from a whitelist of editable fields
    const allowed: string[] = [
      'name',
      'slug',
      'icon',
      'category',
      'sportType',
      'format',
      'contactType',
      'olympicStatus',
      'description',
      'tags',
      'isActive',
      'displayOrder',
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update.' },
        { status: 400 }
      );
    }

    const updated = await db.sport.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update sport:', error);
    return NextResponse.json(
      { error: 'Failed to update sport', detail: String(error) },
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

    const existing = await db.sport.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Sport not found.' }, { status: 404 });
    }

    await db.sport.delete({ where: { id } });

    return NextResponse.json({ ok: true, deleted: id });
  } catch (error) {
    console.error('Failed to delete sport:', error);
    return NextResponse.json(
      { error: 'Failed to delete sport', detail: String(error) },
      { status: 500 }
    );
  }
}

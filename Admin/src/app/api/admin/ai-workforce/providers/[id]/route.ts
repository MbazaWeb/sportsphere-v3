import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * PATCH /api/admin/ai-workforce/providers/[id]
 * Update provider.
 * Body: { name?, displayName?, apiKey?, baseUrl?, isActive? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.aIProvider.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.displayName !== undefined) updates.displayName = String(body.displayName).trim();
    if (body.apiKey !== undefined) updates.apiKey = String(body.apiKey).trim();
    if (body.baseUrl !== undefined) updates.baseUrl = body.baseUrl ? String(body.baseUrl).trim() : null;
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

    const provider = await db.aIProvider.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ data: provider });
  } catch (error) {
    console.error('Failed to update provider:', error);
    return NextResponse.json(
      { error: 'Failed to update provider', detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/ai-workforce/providers/[id]
 * Delete provider.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.aIProvider.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    await db.aIProvider.delete({ where: { id } });

    return NextResponse.json({ data: { id, deleted: true } });
  } catch (error) {
    console.error('Failed to delete provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider', detail: String(error) },
      { status: 500 }
    );
  }
}

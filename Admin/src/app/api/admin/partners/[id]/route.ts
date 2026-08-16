import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/admin/partners/[id] — single partner with full relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const partner = await db.commercialPartner.findUnique({
      where: { id },
      include: {
        campaigns: {
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { dailyMetrics: true } } },
        },
        sponsorships: { orderBy: { createdAt: 'desc' } },
        assets: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        metricSnapshots: { orderBy: { date: 'desc' }, take: 30 },
        _count: { select: { campaigns: true, sponsorships: true, assets: true, metricSnapshots: true } },
      },
    });
    if (!partner) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(partner);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PATCH /api/admin/partners/[id] — update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await db.commercialPartner.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data: any = { updatedAt: new Date() };
    const fields = [
      'name', 'partnerType', 'industry', 'website', 'logoUrl', 'coverUrl',
      'country', 'city', 'description', 'contactName', 'contactEmail',
      'contactPhone', 'currency', 'status', 'tier', 'isActive',
    ] as const;
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f] === '' ? null : body[f];
    }
    if (body.contractValue !== undefined) {
      data.contractValue = body.contractValue === '' || body.contractValue == null ? null : Number(body.contractValue);
    }
    if (body.contractStart) data.contractStart = new Date(body.contractStart);
    if (body.contractEnd) data.contractEnd = new Date(body.contractEnd);
    if (body.metadata !== undefined) data.metadata = body.metadata;

    const updated = await db.commercialPartner.update({ where: { id }, data });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'partner.update',
        module: 'commercial',
        targetId: id,
        targetType: 'CommercialPartner',
        oldValue: existing as any,
        newValue: data as any,
      },
    });

    return NextResponse.json({ ok: true, partner: updated });
  } catch (e) {
    console.error('Partner update error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/admin/partners/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.commercialPartner.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.commercialPartner.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'partner.delete',
        module: 'commercial',
        targetId: id,
        targetType: 'CommercialPartner',
        oldValue: existing as any,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Partner delete error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

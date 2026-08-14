import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/admin/partners/[id]/assets
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const assets = await db.brandAsset.findMany({
      where: { partnerId: id },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
    return NextResponse.json(assets);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/admin/partners/[id]/assets
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const partner = await db.commercialPartner.findUnique({ where: { id } });
    if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

    const body = await request.json();
    const { assetType, url, mimeType, fileSize, alt, description, isPrimary, sortOrder } = body;

    if (!assetType || !url) {
      return NextResponse.json({ error: 'assetType and url required' }, { status: 400 });
    }

    // If setting as primary, unset other primaries of same type
    if (isPrimary) {
      await db.brandAsset.updateMany({
        where: { partnerId: id, assetType, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const asset = await db.brandAsset.create({
      data: {
        id: crypto.randomUUID(),
        partnerId: id,
        assetType,
        url,
        mimeType: mimeType || null,
        fileSize: fileSize != null ? Number(fileSize) : null,
        alt: alt || null,
        description: description || null,
        isPrimary: isPrimary || false,
        sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json({ ok: true, asset }, { status: 201 });
  } catch (e) {
    console.error('Asset create error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/admin/partners/[id]/assets — delete by asset ID in body
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id: partnerId } = await params;
    const { assetId } = await request.json();
    if (!assetId) return NextResponse.json({ error: 'assetId required' }, { status: 400 });

    await db.brandAsset.deleteMany({ where: { id: assetId, partnerId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

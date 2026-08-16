import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { v4 as uuid } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

// GET /api/admin/partners — list with search, filter, pagination
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const tier = searchParams.get('tier') || '';
    const partnerType = searchParams.get('partnerType') || '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (tier) where.tier = tier;
    if (partnerType) where.partnerType = partnerType;

    const [data, total] = await Promise.all([
      db.commercialPartner.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { campaigns: true, sponsorships: true, assets: true } },
        },
      }),
      db.commercialPartner.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (e) {
    console.error('Partners list error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/admin/partners — create
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { name, partnerType, industry, website, logoUrl, coverUrl,
      country, city, description, contactName, contactEmail, contactPhone,
      contractStart, contractEnd, contractValue, currency, status, tier } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const slug = slugify(name);

    const partner = await db.commercialPartner.create({
      data: {
        id,
        name: name.trim(),
        slug,
        partnerType: partnerType || 'brand',
        industry: industry || null,
        website: website || null,
        logoUrl: logoUrl || null,
        coverUrl: coverUrl || null,
        country: country || null,
        city: city || null,
        description: description || null,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        contractStart: contractStart ? new Date(contractStart) : null,
        contractEnd: contractEnd ? new Date(contractEnd) : null,
        contractValue: contractValue != null ? Number(contractValue) : null,
        currency: currency || 'USD',
        status: status || 'pending',
        tier: tier || 'bronze',
      },
    });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'partner.create',
        module: 'commercial',
        targetId: id,
        targetType: 'CommercialPartner',
        newValue: partner as any,
      },
    });

    return NextResponse.json({ ok: true, partner }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Slug conflict — try a different name' }, { status: 409 });
    }
    console.error('Partner create error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

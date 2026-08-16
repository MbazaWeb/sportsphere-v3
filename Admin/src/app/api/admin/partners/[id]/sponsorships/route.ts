import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/admin/partners/[id]/sponsorships
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const sponsorships = await db.partnerSponsorship.findMany({
      where: { partnerId: id },
      orderBy: { createdAt: 'desc' },
    });

    // Resolve entity names
    const enriched = [];
    for (const s of sponsorships) {
      const entry: any = { ...s, entityName: null, entityLogo: null };
      if (s.entityType === 'team') {
        const team = await db.team.findUnique({ where: { id: s.entityId }, select: { name: true, logoUrl: true } });
        if (team) { entry.entityName = team.name; entry.entityLogo = team.logoUrl; }
      } else if (s.entityType === 'competition') {
        const league = await db.league.findUnique({ where: { id: s.entityId }, select: { name: true } });
        if (league) entry.entityName = league.name;
      } else if (s.entityType === 'athlete') {
        const player = await db.player.findUnique({ where: { id: s.entityId }, select: { name: true, photoUrl: true } });
        if (player) { entry.entityName = player.name; entry.entityLogo = player.photoUrl; }
      }
      enriched.push(entry);
    }

    return NextResponse.json(enriched);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/admin/partners/[id]/sponsorships
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
    const { entityType, entityId, sponsorshipType, startDate, endDate,
      value, currency, isVisible, displayLabel, notes } = body;

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId required' }, { status: 400 });
    }

    const sponsorship = await db.partnerSponsorship.create({
      data: {
        id: crypto.randomUUID(),
        partnerId: id,
        entityType,
        entityId,
        sponsorshipType: sponsorshipType || 'sponsor',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        value: value != null ? Number(value) : null,
        currency: currency || 'USD',
        isVisible: isVisible !== false,
        displayLabel: displayLabel || null,
        notes: notes || null,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'sponsorship.create',
        module: 'commercial',
        targetId: sponsorship.id,
        targetType: 'PartnerSponsorship',
        newValue: sponsorship as any,
      },
    });

    return NextResponse.json({ ok: true, sponsorship }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'This sponsorship already exists' }, { status: 409 });
    }
    console.error('Sponsorship create error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

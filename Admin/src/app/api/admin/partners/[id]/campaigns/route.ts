import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/admin/partners/[id]/campaigns
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const campaigns = await db.sponsorCampaign.findMany({
      where: { partnerId: id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { dailyMetrics: true } } },
    });
    return NextResponse.json(campaigns);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/admin/partners/[id]/campaigns
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
    const { name, campaignType, status, startDate, endDate, budget, currency,
      description, objectives, targetAudience, creatives } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Campaign name required' }, { status: 400 });
    }

    const campaign = await db.sponsorCampaign.create({
      data: {
        id: crypto.randomUUID(),
        partnerId: id,
        name: name.trim(),
        campaignType: campaignType || 'brand_awareness',
        status: status || 'draft',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget != null ? Number(budget) : null,
        currency: currency || 'USD',
        description: description || null,
        objectives: objectives || null,
        targetAudience: targetAudience || null,
        creatives: Array.isArray(creatives) ? creatives : [],
      },
    });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'campaign.create',
        module: 'commercial',
        targetId: campaign.id,
        targetType: 'SponsorCampaign',
        newValue: campaign as any,
      },
    });

    return NextResponse.json({ ok: true, campaign }, { status: 201 });
  } catch (e) {
    console.error('Campaign create error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET /api/admin/partners/[id]/metrics — aggregated metrics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const period = searchParams.get('period') || 'monthly';
    const limit = Number(searchParams.get('limit')) || 12;

    // Get campaign aggregate metrics
    const campaignAgg = await db.sponsorCampaign.aggregate({
      where: { partnerId: id },
      _sum: {
        totalImpressions: true,
        totalClicks: true,
        totalConversions: true,
        totalEngagement: true,
        budget: true,
      },
      _count: true,
    });

    // Get snapshot history
    const snapshots = await db.partnerMetricSnapshot.findMany({
      where: { partnerId: id, period },
      orderBy: { date: 'desc' },
      take: limit,
    });

    // Get campaign-level daily metrics (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyMetrics = await db.campaignDailyMetric.findMany({
      where: {
        campaign: { partnerId: id },
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'asc' },
    });

    // Aggregate daily metrics by date
    const dailyAgg = new Map<string, { impressions: number; clicks: number; conversions: number; engagement: number; spend: number }>();
    for (const m of dailyMetrics) {
      const key = m.date.toISOString().split('T')[0];
      const existing = dailyAgg.get(key) || { impressions: 0, clicks: 0, conversions: 0, engagement: 0, spend: 0 };
      existing.impressions += m.impressions;
      existing.clicks += m.clicks;
      existing.conversions += m.conversions;
      existing.engagement += m.engagement;
      existing.spend += m.spend || 0;
      dailyAgg.set(key, existing);
    }

    const totalImpressions = campaignAgg._sum.totalImpressions || 0;
    const totalClicks = campaignAgg._sum.totalClicks || 0;
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';

    return NextResponse.json({
      summary: {
        totalImpressions,
        totalClicks,
        totalConversions: campaignAgg._sum.totalConversions || 0,
        totalEngagement: campaignAgg._sum.totalEngagement || 0,
        ctr: Number(ctr),
        totalBudget: campaignAgg._sum.budget || 0,
        activeCampaigns: campaignAgg._count,
      },
      snapshots,
      dailyMetrics: Array.from(dailyAgg.entries()).map(([date, vals]) => ({ date, ...vals })),
    });
  } catch (e) {
    console.error('Partner metrics error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/admin/partners/[id]/metrics — record a metric snapshot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { period, date, impressions, clicks, conversions, engagement, ctr, spend, revenue } = body;

    if (!period || !date) {
      return NextResponse.json({ error: 'period and date required' }, { status: 400 });
    }

    const snapshot = await db.partnerMetricSnapshot.upsert({
      where: {
        partnerId_period_date: { partnerId: id, period, date: new Date(date) },
      },
      create: {
        id: crypto.randomUUID(),
        partnerId: id,
        period,
        date: new Date(date),
        impressions: BigInt(impressions || 0),
        clicks: BigInt(clicks || 0),
        conversions: BigInt(conversions || 0),
        engagement: BigInt(engagement || 0),
        ctr: ctr != null ? Number(ctr) : null,
        spend: spend != null ? Number(spend) : null,
        revenue: revenue != null ? Number(revenue) : null,
      },
      update: {
        impressions: BigInt(impressions || 0),
        clicks: BigInt(clicks || 0),
        conversions: BigInt(conversions || 0),
        engagement: BigInt(engagement || 0),
        ctr: ctr != null ? Number(ctr) : null,
        spend: spend != null ? Number(spend) : null,
        revenue: revenue != null ? Number(revenue) : null,
      },
    });

    return NextResponse.json({ ok: true, snapshot });
  } catch (e) {
    console.error('Metric snapshot error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

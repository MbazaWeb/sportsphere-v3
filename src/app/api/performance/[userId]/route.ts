// ─── Performance API Route ────────────────────────────────────────
//
// GET /api/performance/[userId]
// Returns the cached PerformanceProfile + recent events, transactions,
// and snapshots for the Performance Card UI.
//
// If no profile exists yet, returns a 200 with `{ profile: null }`.

import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getPerformanceProfileWithActivity, recalcPerformanceProfile } from '@/lib/performance-engine';
import { verifyAdminSession } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // FIX: ?recalc=1 requires admin authentication
    const url = new URL(_req.url);
    const forceRecalc = url.searchParams.get('recalc') === '1';

    if (forceRecalc) {
      const auth = await verifyAdminSession(_req);
      if (!auth.authorized) return auth.response;
      await recalcPerformanceProfile(userId);
    }

    const data = await getPerformanceProfileWithActivity(userId);

    // Fetch the user's basic info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true, name: true, handle: true, avatarUrl: true,
        currentCountry: true, region: true, nationality: true,
        playerProfile: { select: { position: true, playerType: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Compute tier percentile
    let percentile: number | null = null;
    let categorySize = 0;
    if (data.profile?.categoryBucket) {
      const peers = await db.performanceProfile.count({
        where: { categoryBucket: data.profile.categoryBucket },
      });
      categorySize = peers;
      if (peers > 0 && data.profile.rankCategory > 0) {
        percentile = (data.profile.rankCategory / peers) * 100;
      }
    }

    return NextResponse.json({
      user: {
        id: userId,
        name: user.name,
        handle: user.handle,
        avatarUrl: user.avatarUrl,
        role: user.role,
        position: user.playerProfile?.position ?? null,
        playerType: user.playerProfile?.playerType ?? null,
        country: user.currentCountry ?? user.nationality ?? null,
      },
      profile: data.profile,
      events: data.events,
      transactions: data.transactions,
      snapshots: data.snapshots,
      categorySize,
      percentile,
    });
  } catch (error) {
    console.error('Performance fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 },
    );
  }
}

// ─── Performance API Route ────────────────────────────────────────
//
// GET /api/performance/[userId]
// Returns the cached PerformanceProfile + recent events, transactions,
// and snapshots for the Performance Card UI.
//
// If no profile exists yet (new user with no verified events), returns
// a 200 with `{ profile: null, computed: null }` — the UI will show
// an "unranked" placeholder.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPerformanceProfileWithActivity, recalcPerformanceProfile } from '@/lib/performance-engine';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // Optional: ?recalc=1 forces a recompute (admin/debug only — heavy)
    const url = new URL(_req.url);
    const forceRecalc = url.searchParams.get('recalc') === '1';
    if (forceRecalc) {
      await recalcPerformanceProfile(userId);
    }

    const data = await getPerformanceProfileWithActivity(userId);

    // Fetch the user's basic info to know their role + position
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

    // Compute tier percentile (top X% in their category bucket)
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

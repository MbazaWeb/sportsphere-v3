import { NextRequest, NextResponse } from 'next/server';
import { runDailyDecay, runDailySnapshot, recomputeRankings } from '@/lib/performance-engine/persistence';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/performance
 * Triggers the daily performance engine maintenance tasks.
 *
 * Required Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'sportsphere-default-cron-secret-2026';

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting Performance Engine maintenance...');

    // 1. Apply inactivity decay
    const decayResult = await runDailyDecay();
    console.log(`[Cron] Decay applied: ${decayResult.decayed}/${decayResult.processed} profiles.`);

    // 2. Capture snapshots for trend history
    const snapshotResult = await runDailySnapshot();
    console.log(`[Cron] Snapshots captured: ${snapshotResult.captured} profiles.`);

    // 3. Recompute all rankings
    await recomputeRankings();
    console.log('[Cron] Rankings recomputed.');

    return NextResponse.json({
      success: true,
      decay: decayResult,
      snapshots: snapshotResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Performance Engine maintenance failed:', error);
    return NextResponse.json({
      error: 'Maintenance failed',
      message: error.message
    }, { status: 500 });
  }
}

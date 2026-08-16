import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { syncFromProviders } from '@/lib/sports-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/ai/sync
 *   Body: { providers?: string[], sports?: string[] }
 *   Calls syncFromProviders() from @/lib/sports-sync.
 *   Returns the SyncResult array. Also creates an AIJobLog entry.
 */
export async function POST(request: NextRequest) {
  const cronHeader = request.headers.get("x-cron-secret") || request.headers.get("X-Cron-Secret");
  const expectedSecret = process.env.CRON_SECRET || "sportsphere-sync-key-2026";
  const isCron = cronHeader === expectedSecret;

  if (!isCron) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;
  }

  const job = await db.aIJobLog.create({
    data: {
      jobType: 'sync_sports',
      status: 'running',
      triggeredBy: 'manual',
    },
  });

  try {
    const body = (await request.json().catch(() => ({}))) as {
      providers?: string[];
      sports?: string[];
    };

    const results = await syncFromProviders({
      providers: body.providers,
      sports: body.sports,
    });

    // Aggregate counts
    const totals = results.reduce(
      (acc, r) => {
        acc.leaguesCreated += r.leaguesCreated;
        acc.leaguesUpdated += r.leaguesUpdated;
        acc.teamsCreated += r.teamsCreated;
        acc.teamsUpdated += r.teamsUpdated;
        acc.playersCreated += r.playersCreated;
        acc.playersUpdated += r.playersUpdated;
        acc.matchesCreated += r.matchesCreated;
        acc.matchesUpdated += r.matchesUpdated;
        acc.errors.push(...r.errors);
        return acc;
      },
      {
        leaguesCreated: 0, leaguesUpdated: 0,
        teamsCreated: 0, teamsUpdated: 0,
        playersCreated: 0, playersUpdated: 0,
        matchesCreated: 0, matchesUpdated: 0,
        errors: [] as string[],
      }
    );

    const itemsCreated =
      totals.leaguesCreated + totals.teamsCreated + totals.playersCreated + totals.matchesCreated;
    const itemsUpdated =
      totals.leaguesUpdated + totals.teamsUpdated + totals.playersUpdated + totals.matchesUpdated;

    await db.aIJobLog.update({
      where: { id: job.id },
      data: {
        status: totals.errors.length > 0 ? 'partial' : 'success',
        itemsProcessed: itemsCreated + itemsUpdated,
        itemsCreated,
        itemsUpdated,
        logMessage: `Synced ${results.length} provider/sport combinations. Created ${itemsCreated}, updated ${itemsUpdated}.`,
        errorDetails: { errors: totals.errors, results: results as any } as any,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      jobId: job.id,
      results,
      totals,
    });
  } catch (error) {
    console.error('AI sync failed:', error);
    await db.aIJobLog.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        logMessage: 'Sync failed',
        errorDetails: { fatal: String(error) },
        completedAt: new Date(),
      },
    });
    return NextResponse.json(
      { error: 'Sync failed', detail: String(error) },
      { status: 500 }
    );
  }
}

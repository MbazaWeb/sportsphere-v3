import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai/jobs
 *   ?limit=50
 *   List recent AIJobLog entries (newest first).
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || '50')));

    const jobs = await db.aIJobLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ data: jobs });
  } catch (error) {
    console.error('Failed to fetch AI jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI jobs', detail: String(error) },
      { status: 500 }
    );
  }
}

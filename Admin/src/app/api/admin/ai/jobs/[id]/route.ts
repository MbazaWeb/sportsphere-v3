import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai/jobs/[id]
 *   Single AI job with full errorDetails.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const job = await db.aIJobLog.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: 'AI job not found' }, { status: 404 });
    }
    return NextResponse.json(job);
  } catch (error) {
    console.error('Failed to fetch AI job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI job', detail: String(error) },
      { status: 500 }
    );
  }
}

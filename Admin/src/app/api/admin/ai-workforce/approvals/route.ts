import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/approvals
 * List pending approvals.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const agentId = searchParams.get('agentId') || undefined;

    const where: Record<string, unknown> = { status };
    if (agentId) where.agentId = agentId;

    const approvals = await db.aIAgentApproval.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: { select: { id: true, name: true, department: true } },
        task: { select: { id: true, type: true, status: true } },
      },
    });

    return NextResponse.json({ data: approvals });
  } catch (error) {
    console.error('Failed to fetch approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals', detail: String(error) },
      { status: 500 }
    );
  }
}

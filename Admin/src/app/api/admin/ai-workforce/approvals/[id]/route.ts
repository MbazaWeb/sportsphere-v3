import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { getOrchestrator } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/admin/ai-workforce/approvals/[id]
 * Approve/reject an approval.
 * Body: { approved: boolean, response?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.aIAgentApproval.findUnique({
      where: { id },
      select: { id: true, taskId: true, agentId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }
    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Approval is not pending (status: ${existing.status})` },
        { status: 400 }
      );
    }

    const body = await request.json();
    if (typeof body.approved !== 'boolean') {
      return NextResponse.json({ error: 'approved (boolean) is required' }, { status: 400 });
    }

    const newStatus = body.approved ? 'APPROVED' : 'REJECTED';

    await db.aIAgentApproval.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedById: auth.user.sub,
        reviewedAt: new Date(),
        response: body.response ? String(body.response) : null,
      },
    });

    // Also process via orchestrator to handle task status
    try {
      const orchestrator = getOrchestrator();
      await orchestrator.approveTask({
        taskId: existing.taskId,
        userId: auth.user.sub,
        approved: body.approved,
        response: body.response ? String(body.response) : undefined,
      });
    } catch {
      // Orchestrator may have already been processed, that's ok
    }

    // Audit log
    try {
      await db.aIAgentAuditLog.create({
        data: {
          agentId: existing.agentId,
          taskId: existing.taskId,
          action: body.approved ? 'approval.approved' : 'approval.rejected',
          userId: auth.user.sub,
          outputSnapshot: { approvalId: id, approved: body.approved },
        },
      });
    } catch { /* optional */ }

    return NextResponse.json({
      data: { approvalId: id, status: newStatus },
    });
  } catch (error) {
    console.error('Failed to process approval:', error);
    return NextResponse.json(
      { error: 'Failed to process approval', detail: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { getOrchestrator } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/admin/ai-workforce/tasks/[id]/approve
 * Approve or reject a task.
 * Body: { approved: boolean, response?: string }
 * Uses orchestrator.approveTask().
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.approved !== 'boolean') {
      return NextResponse.json({ error: 'approved (boolean) is required' }, { status: 400 });
    }

    const orchestrator = getOrchestrator();
    await orchestrator.approveTask({
      taskId: id,
      userId: auth.user.sub,
      approved: body.approved,
      response: body.response ? String(body.response) : undefined,
    });

    // Audit log
    try {
      const task = await db.aIAgentTask.findUnique({
        where: { id },
        select: { agentId: true },
      });
      if (task) {
        await db.aIAgentAuditLog.create({
          data: {
            agentId: task.agentId,
            taskId: id,
            action: body.approved ? 'task.approved' : 'task.rejected',
            userId: auth.user.sub,
            outputSnapshot: { approved: body.approved, response: body.response || null },
          },
        });
      }
    } catch { /* optional */ }

    return NextResponse.json({
      data: { taskId: id, approved: body.approved },
    });
  } catch (error) {
    console.error('Failed to approve/reject task:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to process approval', detail: message },
      { status: 500 }
    );
  }
}

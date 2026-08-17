import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/tasks/[id]
 * Get a task with all executions and messages.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const task = await db.aIAgentTask.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, department: true, model: true } },
        executions: { orderBy: { createdAt: 'asc' } },
        messages: { orderBy: { createdAt: 'asc' } },
        approvals: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task', detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/ai-workforce/tasks/[id]
 * Update task (e.g. cancel).
 * Body: { status? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.aIAgentTask.findUnique({
      where: { id },
      select: { id: true, status: true, agentId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedStatuses = new Set(['QUEUED', 'RUNNING', 'BLOCKED', 'COMPLETED', 'FAILED', 'CANCELLED']);

    const updates: Record<string, unknown> = {};
    if (body.status !== undefined && allowedStatuses.has(body.status)) {
      updates.status = body.status;
      if (body.status === 'CANCELLED' || body.status === 'COMPLETED' || body.status === 'FAILED') {
        updates.completedAt = new Date();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const task = await db.aIAgentTask.update({
      where: { id },
      data: updates,
    });

    // Audit log
    try {
      await db.aIAgentAuditLog.create({
        data: {
          agentId: existing.agentId,
          taskId: id,
          action: 'task.updated',
          userId: auth.user.sub,
          beforeState: { status: existing.status },
          afterState: updates,
        },
      });
    } catch { /* optional */ }

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json(
      { error: 'Failed to update task', detail: String(error) },
      { status: 500 }
    );
  }
}

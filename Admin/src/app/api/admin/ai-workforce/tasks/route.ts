import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { getOrchestrator } from '@/lib/ai/orchestrator';
import { TaskPriority } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/tasks
 * List tasks with pagination and agent name.
 * Query params: ?page=1&limit=20&status=&agentId=
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') || undefined;
    const agentId = searchParams.get('agentId') || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (agentId) where.agentId = agentId;

    const [total, tasks] = await Promise.all([
      db.aIAgentTask.count({ where }),
      db.aIAgentTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          agent: { select: { id: true, name: true, department: true } },
        },
      }),
    ]);

    return NextResponse.json({ data: tasks, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-workforce/tasks
 * Create a new task.
 * Body: { agentId, type, input, priority? }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const agentId = String(body.agentId || '').trim();
    const type = String(body.type || 'chat').trim();

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    const allowedPriorities = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
    const priority = allowedPriorities.has(body.priority) ? body.priority : TaskPriority.MEDIUM;

    const orchestrator = getOrchestrator();
    const task = await orchestrator.createTask({
      agentId,
      type,
      input: body.input || {},
      priority,
      userId: auth.user.sub,
    });

    // Audit log
    try {
      await db.aIAgentAuditLog.create({
        data: {
          agentId,
          taskId: task.id,
          action: 'task.created',
          userId: auth.user.sub,
          inputSnapshot: { type, priority },
        },
      });
    } catch { /* optional */ }

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to create task', detail: message },
      { status: 500 }
    );
  }
}

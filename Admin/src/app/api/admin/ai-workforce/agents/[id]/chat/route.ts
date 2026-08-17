import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { getOrchestrator } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/admin/ai-workforce/agents/[id]/chat
 * Send a chat message to a specific agent.
 * Body: { message: string }
 * Uses orchestrator.chat(). Returns response.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const agent = await db.aIAgent.findUnique({ where: { id }, select: { id: true, status: true, name: true } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    if (agent.status !== 'ACTIVE') {
      return NextResponse.json({ error: `Agent "${agent.name}" is not active (status: ${agent.status})` }, { status: 400 });
    }

    const body = await request.json();
    const message = String(body.message || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const orchestrator = getOrchestrator();
    const result = await orchestrator.chat({
      message,
      userId: auth.user.sub,
      agentId: id,
    });

    // Audit log
    try {
      await db.aIAgentAuditLog.create({
        data: {
          agentId: id,
          taskId: result.taskId,
          action: 'agent.chat',
          userId: auth.user.sub,
          inputSnapshot: { message: message.slice(0, 500) },
          costUsd: result.costUsd,
        },
      });
    } catch { /* optional */ }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to chat with agent:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to chat with agent', detail: message },
      { status: 500 }
    );
  }
}

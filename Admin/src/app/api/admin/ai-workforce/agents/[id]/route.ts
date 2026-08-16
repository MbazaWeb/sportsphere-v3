import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/agents/[id]
 * Get a single agent with full details: tools, permissions, budget, last 10 tasks, KPIs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const agent = await db.aIAgent.findUnique({
      where: { id },
      include: {
        tools: true,
        permissions: true,
        budget: true,
        kpis: { orderBy: { measuredAt: 'desc' }, take: 20 },
        supervisor: { select: { id: true, name: true, department: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            status: true,
            priority: true,
            createdAt: true,
            completedAt: true,
            tokensUsed: true,
            costEstimate: true,
            errorMessage: true,
          },
        },
        _count: { select: { tasks: true, executions: true, auditLogs: true, tools: true, permissions: true } },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ data: agent });
  } catch (error) {
    console.error('Failed to fetch agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent', detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/ai-workforce/agents/[id]
 * Update agent fields: name, status, model, systemPrompt, autonomyLevel, budget.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.aIAgent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedStatuses = new Set(['ACTIVE', 'PAUSED', 'DISABLED']);

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.systemPrompt !== undefined) updates.systemPrompt = String(body.systemPrompt).trim();
    if (body.model !== undefined) updates.model = String(body.model).trim();
    if (body.department !== undefined) updates.department = String(body.department).trim();
    if (body.role !== undefined) updates.role = String(body.role).trim();
    if (body.status !== undefined && allowedStatuses.has(body.status)) updates.status = body.status;
    if (body.autonomyLevel !== undefined) {
      updates.autonomyLevel = Math.max(0, Math.min(4, Number(body.autonomyLevel)));
    }
    if (body.supervisorId !== undefined) updates.supervisorId = body.supervisorId || null;
    if (body.humanOwnerId !== undefined) updates.humanOwnerId = body.humanOwnerId || null;

    const agent = await db.aIAgent.update({
      where: { id },
      data: updates,
    });

    // Update budget if provided
    if (body.budget && typeof body.budget === 'object') {
      const b = body.budget as Record<string, unknown>;
      const budgetData: Record<string, unknown> = {};
      if (b.monthlyLimitUsd !== undefined) budgetData.monthlyLimitUsd = Number(b.monthlyLimitUsd);
      if (b.alertThreshold !== undefined) budgetData.alertThreshold = Number(b.alertThreshold);

      await db.aIAgentBudget.upsert({
        where: { agentId: id },
        create: {
          agentId: id,
          monthlyLimitUsd: Number(b.monthlyLimitUsd || 50),
          alertThreshold: Number(b.alertThreshold || 0.8),
        },
        update: budgetData,
      });
    }

    // Audit log
    try {
      await db.aIAgentAuditLog.create({
        data: {
          agentId: id,
          action: 'agent.updated',
          userId: auth.user.sub,
          beforeState: { name: existing.name, status: existing.status, model: existing.model, autonomyLevel: existing.autonomyLevel },
          afterState: updates,
        },
      });
    } catch { /* optional */ }

    return NextResponse.json({ data: agent });
  } catch (error) {
    console.error('Failed to update agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent', detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/ai-workforce/agents/[id]
 * Soft-disable agent (set status to DISABLED).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.aIAgent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = await db.aIAgent.update({
      where: { id },
      data: { status: 'DISABLED' },
    });

    // Audit log
    try {
      await db.aIAgentAuditLog.create({
        data: {
          agentId: id,
          action: 'agent.disabled',
          userId: auth.user.sub,
          beforeState: { status: existing.status },
          afterState: { status: 'DISABLED' },
        },
      });
    } catch { /* optional */ }

    return NextResponse.json({ data: agent });
  } catch (error) {
    console.error('Failed to disable agent:', error);
    return NextResponse.json(
      { error: 'Failed to disable agent', detail: String(error) },
      { status: 500 }
    );
  }
}

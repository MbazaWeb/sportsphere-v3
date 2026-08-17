import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/agents
 * List all agents with tool count, task count, and budget info.
 * Query params: ?status=ACTIVE&department=
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const department = searchParams.get('department') || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (department) where.department = department;

    const agents = await db.aIAgent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { tools: true, tasks: true } },
        budget: { select: { monthlyLimitUsd: true, spentThisMonthUsd: true, alertThreshold: true } },
      },
    });

    return NextResponse.json({ data: agents });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents', detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-workforce/agents
 * Create a new agent.
 * Body: { name, department, role, description, systemPrompt, model?, status?, autonomyLevel?, supervisorId?, humanOwnerId?, permissions?, tools?, budget? }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const department = String(body.department || '').trim();
    const role = String(body.role || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!department) {
      return NextResponse.json({ error: 'department is required' }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 });
    }

    const allowedStatuses = new Set(['ACTIVE', 'PAUSED', 'DISABLED']);
    const status = allowedStatuses.has(body.status) ? body.status : 'ACTIVE';
    const autonomyLevel = typeof body.autonomyLevel === 'number'
      ? Math.max(0, Math.min(4, body.autonomyLevel))
      : 1;

    const agent = await db.aIAgent.create({
      data: {
        name,
        department,
        role,
        description: String(body.description || '').trim(),
        systemPrompt: String(body.systemPrompt || '').trim(),
        model: String(body.model || 'gpt-4o-mini'),
        status,
        autonomyLevel,
        supervisorId: body.supervisorId || null,
        humanOwnerId: body.humanOwnerId || null,
      },
    });

    // Create permissions if provided
    const permissions: string[] = Array.isArray(body.permissions)
      ? body.permissions.filter((p: unknown) => typeof p === 'string')
      : [];
    if (permissions.length > 0) {
      await db.aIAgentPermission.createMany({
        data: permissions.map((permission: string) => ({ agentId: agent.id, permission })),
      });
    }

    // Create tools if provided
    const tools: Array<{ toolName: string; description?: string; config?: unknown }> = Array.isArray(body.tools)
      ? body.tools.filter((t: unknown) => typeof t === 'object' && t !== null && typeof (t as Record<string, unknown>).toolName === 'string')
      : [];
    if (tools.length > 0) {
      await db.aIAgentTool.createMany({
        data: tools.map((t: { toolName: string; description?: string; config?: unknown }) => ({
          agentId: agent.id,
          toolName: t.toolName,
          description: t.description || '',
          config: t.config || {},
        })),
      });
    }

    // Create budget if provided
    if (body.budget && typeof body.budget === 'object') {
      const b = body.budget as Record<string, unknown>;
      await db.aIAgentBudget.create({
        data: {
          agentId: agent.id,
          monthlyLimitUsd: typeof b.monthlyLimitUsd === 'number' ? b.monthlyLimitUsd : 50,
          spentThisMonthUsd: 0,
          alertThreshold: typeof b.alertThreshold === 'number' ? b.alertThreshold : 0.8,
        },
      });
    }

    // Create audit log
    try {
      await db.aIAgentAuditLog.create({
        data: {
          agentId: agent.id,
          action: 'agent.created',
          userId: auth.user.sub,
          inputSnapshot: { name, department, role, status, autonomyLevel },
        },
      });
    } catch { /* optional */ }

    return NextResponse.json({ data: agent }, { status: 201 });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent', detail: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/costs
 * Get cost summary: today, this month, by agent, by department.
 * Returns structured cost breakdown.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's cost from executions
    const todayCosts = await db.aIAgentExecution.aggregate({
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
      where: { createdAt: { gte: todayStart } },
    });

    // This month's cost from executions
    const monthCosts = await db.aIAgentExecution.aggregate({
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
      where: { createdAt: { gte: monthStart } },
    });

    // Cost by agent (this month)
    const byAgent = await db.aIAgentExecution.groupBy({
      by: ['agentId'],
      where: { createdAt: { gte: monthStart } },
      _sum: { costUsd: true, inputTokens: true, outputTokens: true, totalTokens: true },
      _count: true,
      orderBy: { _sum: { costUsd: 'desc' } },
    });

    // Enrich by agent with name/department
    const agentIds = byAgent.map(a => a.agentId);
    const agentMap = new Map<string, { name: string; department: string }>();
    if (agentIds.length > 0) {
      const agents = await db.aIAgent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, department: true },
      });
      for (const a of agents) agentMap.set(a.id, { name: a.name, department: a.department });
    }

    const byAgentEnriched = byAgent.map(a => ({
      agentId: a.agentId,
      agentName: agentMap.get(a.agentId)?.name || 'Unknown',
      department: agentMap.get(a.agentId)?.department || 'Unknown',
      costUsd: a._sum.costUsd || 0,
      inputTokens: a._sum.inputTokens || 0,
      outputTokens: a._sum.outputTokens || 0,
      totalTokens: a._sum.totalTokens || 0,
      executionCount: a._count,
    }));

    // Cost by department (this month)
    const byDepartmentRaw = await db.aIAgentExecution.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { agentId: true, costUsd: true, inputTokens: true, outputTokens: true },
    });

    const deptMap = new Map<string, { costUsd: number; inputTokens: number; outputTokens: number; count: number }>();
    for (const exec of byDepartmentRaw) {
      const dept = agentMap.get(exec.agentId)?.department || 'Unknown';
      const existing = deptMap.get(dept) || { costUsd: 0, inputTokens: 0, outputTokens: 0, count: 0 };
      existing.costUsd += exec.costUsd || 0;
      existing.inputTokens += exec.inputTokens || 0;
      existing.outputTokens += exec.outputTokens || 0;
      existing.count += 1;
      deptMap.set(dept, existing);
    }

    const byDepartment = Array.from(deptMap.entries()).map(([department, data]) => ({
      department,
      ...data,
    })).sort((a, b) => b.costUsd - a.costUsd);

    // Budget utilization
    const budgets = await db.aIAgentBudget.findMany({
      include: { agent: { select: { id: true, name: true, department: true, status: true } } },
    });

    return NextResponse.json({
      data: {
        today: {
          costUsd: todayCosts._sum.costUsd || 0,
          inputTokens: todayCosts._sum.inputTokens || 0,
          outputTokens: todayCosts._sum.outputTokens || 0,
        },
        thisMonth: {
          costUsd: monthCosts._sum.costUsd || 0,
          inputTokens: monthCosts._sum.inputTokens || 0,
          outputTokens: monthCosts._sum.outputTokens || 0,
        },
        byAgent: byAgentEnriched,
        byDepartment,
        budgets: budgets.map(b => ({
          agentId: b.agentId,
          agentName: b.agent.name,
          department: b.agent.department,
          agentStatus: b.agent.status,
          monthlyLimitUsd: b.monthlyLimitUsd,
          spentThisMonthUsd: b.spentThisMonthUsd,
          alertThreshold: b.alertThreshold,
          utilizationPercent: b.monthlyLimitUsd > 0
            ? Math.round((b.spentThisMonthUsd / b.monthlyLimitUsd) * 100)
            : 0,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch costs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch costs', detail: String(error) },
      { status: 500 }
    );
  }
}

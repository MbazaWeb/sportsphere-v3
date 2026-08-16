import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/command-center
 * Returns the full command center summary for the overview dashboard:
 * - active agents
 * - running tasks
 * - pending approvals
 * - today's cost
 * - alerts (unread)
 * - recent activity (last 20 audit logs)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Run all queries in parallel for performance
    const [
      agentCounts,
      runningTasks,
      pendingApprovals,
      todayCostResult,
      unreadAlerts,
      recentAuditLogs,
      taskStatusCounts,
    ] = await Promise.all([
      // Agent counts by status
      db.aIAgent.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Currently running tasks
      db.aIAgentTask.findMany({
        where: { status: 'RUNNING' },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: {
          agent: { select: { id: true, name: true, department: true } },
        },
      }),

      // Pending approvals
      db.aIAgentApproval.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          agent: { select: { id: true, name: true, department: true } },
          task: { select: { id: true, type: true } },
        },
      }),

      // Today's cost
      db.aIAgentExecution.aggregate({
        _sum: { costUsd: true, totalTokens: true },
        where: { createdAt: { gte: todayStart } },
      }),

      // Unread alerts
      db.aIAlert.findMany({
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Recent activity (last 20 audit logs)
      db.aIAgentAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          agent: { select: { id: true, name: true, department: true } },
        },
      }),

      // Task status counts
      db.aIAgentTask.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Format agent status counts
    const agentStatus = {} as Record<string, number>;
    for (const g of agentCounts) {
      agentStatus[g.status] = g._count;
    }

    // Format task status counts
    const taskStatus = {} as Record<string, number>;
    for (const g of taskStatusCounts) {
      taskStatus[g.status] = g._count;
    }

    return NextResponse.json({
      data: {
        agents: {
          total: Object.values(agentStatus).reduce((s, v) => s + v, 0),
          active: agentStatus['ACTIVE'] || 0,
          paused: agentStatus['PAUSED'] || 0,
          disabled: agentStatus['DISABLED'] || 0,
        },
        tasks: {
          total: Object.values(taskStatus).reduce((s, v) => s + v, 0),
          running: taskStatus['RUNNING'] || 0,
          queued: taskStatus['QUEUED'] || 0,
          waitingApproval: taskStatus['WAITING_APPROVAL'] || 0,
          completed: taskStatus['COMPLETED'] || 0,
          failed: taskStatus['FAILED'] || 0,
          cancelled: taskStatus['CANCELLED'] || 0,
        },
        runningTasks,
        pendingApprovals,
        pendingApprovalCount: pendingApprovals.length,
        today: {
          costUsd: todayCostResult._sum.costUsd || 0,
          totalTokens: todayCostResult._sum.totalTokens || 0,
        },
        alerts: {
          unreadCount: unreadAlerts.length,
          items: unreadAlerts,
        },
        recentActivity: recentAuditLogs,
      },
    });
  } catch (error) {
    console.error('Failed to fetch command center:', error);
    return NextResponse.json(
      { error: 'Failed to fetch command center', detail: String(error) },
      { status: 500 }
    );
  }
}

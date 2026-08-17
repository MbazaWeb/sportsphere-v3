import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get('admin_session')?.value);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [departments, agents, escalations, alerts, kpis, budgets, totalUsers, totalPlayers, totalTeams, totalMatches, recentRuns, morningBrief] = await Promise.all([
      db.coDepartment.findMany({ include: { kpis: true, budgets: true } }),
      db.coAIAgent.findMany({ orderBy: { lastRunAt: 'desc' } }),
      db.coEscalation.findMany({ where: { status: 'PENDING' }, include: { fromAgent: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
      db.coAlert.findMany({ where: { isResolved: false }, orderBy: { createdAt: 'desc' }, take: 20 }),
      db.coKPI.findMany({ include: { department: true } }),
      db.coBudget.findMany({ where: { period: '2025-FY' }, include: { department: true } }),
      db.user.count(),
      db.player.count(),
      db.team.count(),
      db.matchProfile.count(),
      db.coAgentRunLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      db.coMorningBrief.findFirst({ orderBy: { date: 'desc' } }),
    ]);

    const allKpis = kpis.filter(k => k.target > 0);
    const avgAchievement = allKpis.length > 0
      ? allKpis.reduce((sum, k) => {
          const pct = k.unit === 'hrs' || k.unit === 'days'
            ? Math.min((k.target / Math.max(k.current, 0.1)) * 100, 100)
            : Math.min((k.current / k.target) * 100, 100);
          return sum + pct;
        }, 0) / allKpis.length
      : 50;

    const totalBudget = budgets.reduce((s, b) => s + b.totalBudget, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);
    const budgetUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const activeAgents = agents.filter(a => a.isActive).length;
    const agentsRunLast1h = agents.filter(a => a.lastRunAt && new Date(a.lastRunAt) > new Date(Date.now() - 60 * 60 * 1000)).length;
    const kpiOnTrack = kpis.filter(k => k.status === 'on_track').length;
    const kpiAtRisk = kpis.filter(k => k.status === 'at_risk').length;
    const kpiOffTrack = kpis.filter(k => k.status === 'off_track').length;

    return NextResponse.json({
      company: { name: 'SportSphere Technologies Ltd', ceo: 'David Mbazza', country: 'Tanzania', score: Math.round(avgAchievement) },
      metrics: { totalUsers, totalPlayers, totalTeams, totalMatches, activeAgents, agentsRunLast1h, totalBudget, totalSpent, budgetUsed: Math.round(budgetUsed), pendingEscalations: escalations.length, unresolvedAlerts: alerts.length, criticalAlerts: alerts.filter(a => a.type === 'CRITICAL').length },
      kpiSummary: { total: kpis.length, onTrack: kpiOnTrack, atRisk: kpiAtRisk, offTrack: kpiOffTrack },
      departments: departments.map(d => ({ id: d.id, name: d.name, code: d.code, color: d.color, icon: d.icon, directorName: d.directorName, directorAgentId: d.directorAgentId, kpiCount: d.kpis.length, kpiOnTrack: d.kpis.filter(k => k.status === 'on_track').length, budget: d.budgets[0] ?? null })),
      agents: agents.map(a => ({ id: a.id, agentId: a.agentId, name: a.name, role: a.role, department: a.department, isActive: a.isActive, lastRunAt: a.lastRunAt, totalRuns: a.totalRuns })),
      escalations: escalations.map(e => ({ id: e.id, escalationId: e.escalationId, urgency: e.urgency, title: e.title, summary: e.summary, agentRecommendation: e.agentRecommendation, options: e.options, deadline: e.deadline, agentName: e.fromAgent.name, agentRole: e.fromAgent.role, createdAt: e.createdAt })),
      alerts: alerts.slice(0, 5).map(a => ({ id: a.id, type: a.type, category: a.category, title: a.title, message: a.message, createdAt: a.createdAt })),
      recentActivity: recentRuns.slice(0, 10).map(r => ({ id: r.id, agentId: r.agentId, trigger: r.trigger, status: r.status, summary: r.summary, tokensUsed: r.tokensUsed, durationMs: r.durationMs, createdAt: r.createdAt })),
      morningBrief: morningBrief ? { content: morningBrief.content, date: morningBrief.date } : null,
    });
  } catch (err) {
    console.error('[company/dashboard]', err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}

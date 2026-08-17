/**
 * SportSphere AI Workforce — Tool Framework
 *
 * Defines the ToolDefinition interface, ToolRegistry class, and
 * 8 foundational tools that actually query the database.
 */

import { db } from '@/lib/db';
import type { ToolDefinition, ToolContext, ToolResult, ProviderToolDef } from './types';
import { RiskLevel } from './types';

// ═══════════════════════════════════════════════════════════════
// TOOL REGISTRY
// ═══════════════════════════════════════════════════════════════

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  registerAll(tools: ToolDefinition[]): void {
    for (const t of tools) this.register(t);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  listNames(): string[] {
    return [...this.tools.keys()];
  }

  /** Get all tools the agent is allowed to use, formatted for provider API */
  getToolsForAgent(agentToolNames: string[], agentPermissions: string[]): ProviderToolDef[] {
    const result: ProviderToolDef[] = [];
    for (const name of agentToolNames) {
      const tool = this.tools.get(name);
      if (!tool) continue;
      // Check if agent has all required permissions for this tool
      const hasAllPerms = tool.requiredPermissions.every(p =>
        agentPermissions.includes(p) ||
        this.permissionMatchesWildcard(p, agentPermissions)
      );
      if (!hasAllPerms) continue;

      result.push({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      });
    }
    return result;
  }

  /** Validate that the agent has the required permissions for a tool */
  validatePermissions(toolName: string, agentPermissions: string[]): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) return false;
    return tool.requiredPermissions.every(p =>
      agentPermissions.includes(p) ||
      this.permissionMatchesWildcard(p, agentPermissions)
    );
  }

  /** Execute a tool with the given context */
  async execute(toolName: string, context: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { success: false, error: `Tool "${toolName}" is not registered` };
    }
    try {
      return await tool.handler(context);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Tool execution failed: ${message}` };
    }
  }

  /** Get the risk level of a tool */
  getRiskLevel(toolName: string): RiskLevel {
    return this.tools.get(toolName)?.riskLevel ?? RiskLevel.MEDIUM;
  }

  private permissionMatchesWildcard(
    required: string,
    agentPerms: string[],
  ): boolean {
    const parts = required.split('.');
    for (const perm of agentPerms) {
      const pParts = perm.split('.');
      if (pParts.length !== parts.length) continue;
      let matches = true;
      for (let i = 0; i < parts.length; i++) {
        if (pParts[i] !== '*' && pParts[i] !== parts[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// 8 FOUNDATIONAL TOOLS
// ═══════════════════════════════════════════════════════════════

// 1. get_company_metrics — count users, posts, matches from DB
const getCompanyMetrics: ToolDefinition = {
  name: 'get_company_metrics',
  description: 'Returns high-level company-wide metrics: total users, total posts, total matches, and total teams.',
  parameters: {
    type: 'object',
    properties: {},
  },
  requiredPermissions: ['metrics.company.read'],
  riskLevel: RiskLevel.LOW,
  handler: async (): Promise<ToolResult> => {
    const [userCount, postCount, matchCount, teamCount] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.matchProfile.count(),
      db.team.count(),
    ]);
    return {
      success: true,
      data: {
        totalUsers: userCount,
        totalPosts: postCount,
        totalMatches: matchCount,
        totalTeams: teamCount,
        measuredAt: new Date().toISOString(),
      },
    };
  },
};

// 2. get_department_metrics — return counts for a given department
const getDepartmentMetrics: ToolDefinition = {
  name: 'get_department_metrics',
  description: 'Returns metrics for a specific department. Supported departments: sports, content, partnerships, community, finance.',
  parameters: {
    type: 'object',
    properties: {
      department: {
        type: 'string',
        description: 'The department name (e.g. sports, content, partnerships, community, finance)',
        enum: ['sports', 'content', 'partnerships', 'community', 'finance'],
      },
    },
    required: ['department'],
  },
  requiredPermissions: ['metrics.department.read'],
  riskLevel: RiskLevel.LOW,
  handler: async ({ params }): Promise<ToolResult> => {
    const department = params.department as string;
    const metrics: Record<string, number | string> = {
      department,
      measuredAt: new Date().toISOString(),
    };

    switch (department) {
      case 'sports': {
        const [players, teams, matches, leagues] = await Promise.all([
          db.player.count(),
          db.team.count(),
          db.matchProfile.count(),
          db.league.count(),
        ]);
        metrics.players = players;
        metrics.teams = teams;
        metrics.matches = matches;
        metrics.leagues = leagues;
        break;
      }
      case 'content': {
        const [news, rumors, posts] = await Promise.all([
          db.newsItem.count(),
          db.rumor.count(),
          db.post.count(),
        ]);
        metrics.newsArticles = news;
        metrics.rumors = rumors;
        metrics.userPosts = posts;
        break;
      }
      case 'partnerships': {
        const partners = await db.commercialPartner.count();
        const campaigns = await db.sponsorCampaign.count();
        metrics.partners = partners;
        metrics.campaigns = campaigns;
        break;
      }
      case 'community': {
        const [communities, comments, polls] = await Promise.all([
          db.community.count(),
          db.comment.count(),
          db.poll.count(),
        ]);
        metrics.communities = communities;
        metrics.comments = comments;
        metrics.polls = polls;
        break;
      }
      case 'finance': {
        const partners = await db.commercialPartner.count();
        const campaigns = await db.sponsorCampaign.count();
        metrics.activePartners = partners;
        metrics.activeCampaigns = campaigns;
        // Revenue data is stored in partner metrics — provide a count of snapshots
        const snapshots = await db.partnerMetricSnapshot.count();
        metrics.metricSnapshots = snapshots;
        break;
      }
      default:
        return { success: false, error: `Unknown department: "${department}"` };
    }

    return { success: true, data: metrics };
  },
};

// 3. get_player — fetch a player by ID
const getPlayer: ToolDefinition = {
  name: 'get_player',
  description: 'Fetches detailed information about a player by their UUID.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'The UUID of the player',
      },
    },
    required: ['playerId'],
  },
  requiredPermissions: ['sports.player.read'],
  riskLevel: RiskLevel.LOW,
  handler: async ({ params }): Promise<ToolResult> => {
    const playerId = params.playerId as string;
    const player = await db.player.findUnique({
      where: { id: playerId },
      include: {
        Team: { select: { id: true, name: true, country: true, logoUrl: true } },
        sport: { select: { id: true, name: true } },
      },
    });
    if (!player) {
      return { success: false, error: `Player not found: "${playerId}"` };
    }
    return {
      success: true,
      data: {
        id: player.id,
        name: player.name,
        position: player.position,
        nationality: player.nationality,
        photoUrl: player.photoUrl,
        verified: player.verified,
        team: player.Team ? { id: player.Team.id, name: player.Team.name } : null,
        sport: player.sport ? { id: player.sport.id, name: player.sport.name } : null,
      },
    };
  },
};

// 4. get_team — fetch a team by ID
const getTeam: ToolDefinition = {
  name: 'get_team',
  description: 'Fetches detailed information about a team by its UUID.',
  parameters: {
    type: 'object',
    properties: {
      teamId: {
        type: 'string',
        description: 'The UUID of the team',
      },
    },
    required: ['teamId'],
  },
  requiredPermissions: ['sports.team.read'],
  riskLevel: RiskLevel.LOW,
  handler: async ({ params }): Promise<ToolResult> => {
    const teamId = params.teamId as string;
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        sport: { select: { id: true, name: true } },
        _count: { select: { players: true, matchesAsHome: true, matchesAsAway: true } },
      },
    });
    if (!team) {
      return { success: false, error: `Team not found: "${teamId}"` };
    }
    return {
      success: true,
      data: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        country: team.country,
        logoUrl: team.logoUrl,
        sport: team.sport ? { id: team.sport.id, name: team.sport.name } : null,
        playerCount: team._count.players,
        homeMatchCount: team._count.matchesAsHome,
        awayMatchCount: team._count.matchesAsAway,
      },
    };
  },
};

// 5. get_match — fetch a match by ID
const getMatch: ToolDefinition = {
  name: 'get_match',
  description: 'Fetches detailed information about a match by its UUID.',
  parameters: {
    type: 'object',
    properties: {
      matchId: {
        type: 'string',
        description: 'The UUID of the match (MatchProfile ID)',
      },
    },
    required: ['matchId'],
  },
  requiredPermissions: ['sports.match.read'],
  riskLevel: RiskLevel.LOW,
  handler: async ({ params }): Promise<ToolResult> => {
    const matchId = params.matchId as string;
    const match = await db.matchProfile.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        League: { select: { id: true, name: true, country: true } },
        sport: { select: { id: true, name: true } },
      },
    });
    if (!match) {
      return { success: false, error: `Match not found: "${matchId}"` };
    }
    return {
      success: true,
      data: {
        id: match.id,
        status: match.status,
        homeTeam: match.homeTeam ? { id: match.homeTeam.id, name: match.homeTeam.name } : null,
        awayTeam: match.awayTeam ? { id: match.awayTeam.id, name: match.awayTeam.name } : null,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        kickoffAt: match.kickoffAt,
        league: match.League ? { id: match.League.id, name: match.League.name } : null,
        sport: match.sport ? { id: match.sport.id, name: match.sport.name } : null,
        venue: match.venue,
      },
    };
  },
};

// 6. create_task — create an AIAgentTask
const createTask: ToolDefinition = {
  name: 'create_task',
  description: 'Creates a new AI agent task for delegation. Requires a target agentId, task type, and input data.',
  parameters: {
    type: 'object',
    properties: {
      agentId: {
        type: 'string',
        description: 'The UUID of the agent to assign the task to',
      },
      type: {
        type: 'string',
        description: 'The task type (e.g. analysis, report, action)',
      },
      input: {
        type: 'object',
        description: 'The input data for the task as a JSON object',
      },
      priority: {
        type: 'string',
        description: 'Task priority: LOW, MEDIUM, HIGH, CRITICAL',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      },
    },
    required: ['agentId', 'type', 'input'],
  },
  requiredPermissions: ['agent.task.create'],
  riskLevel: RiskLevel.MEDIUM,
  handler: async ({ params, agentId, userId }): Promise<ToolResult> => {
    const targetAgentId = params.agentId as string;
    const type = params.type as string;
    const input = (params.input as Record<string, unknown>) || {};
    const priority = (params.priority as string) || 'MEDIUM';

    // Verify the target agent exists and is active
    const targetAgent = await db.aIAgent.findUnique({
      where: { id: targetAgentId },
      select: { id: true, status: true, name: true },
    });
    if (!targetAgent) {
      return { success: false, error: `Target agent not found: "${targetAgentId}"` };
    }
    if (targetAgent.status !== 'ACTIVE') {
      return { success: false, error: `Target agent "${targetAgent.name}" is not active (status: ${targetAgent.status})` };
    }

    const task = await db.aIAgentTask.create({
      data: {
        agentId: targetAgentId,
        type,
        priority,
        input,
        status: 'QUEUED',
        createdById: userId,
      },
    });

    return {
      success: true,
      data: {
        taskId: task.id,
        agentId: targetAgentId,
        agentName: targetAgent.name,
        type,
        priority,
        status: task.status,
      },
    };
  },
};

// 7. get_revenue_summary — basic revenue count (placeholder)
const getRevenueSummary: ToolDefinition = {
  name: 'get_revenue_summary',
  description: 'Returns a summary of revenue-related metrics including partner counts and campaign activity.',
  parameters: {
    type: 'object',
    properties: {
      period: {
        type: 'string',
        description: 'Time period: today, this_week, this_month, this_year, all_time',
        enum: ['today', 'this_week', 'this_month', 'this_year', 'all_time'],
      },
    },
  },
  requiredPermissions: ['finance.revenue.read'],
  riskLevel: RiskLevel.LOW,
  handler: async ({ params }): Promise<ToolResult> => {
    const period = (params.period as string) || 'this_month';

    // Build date filter
    let dateFilter: Date | undefined;
    const now = new Date();
    switch (period) {
      case 'today':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'this_week': {
        const dayOfWeek = now.getDay() || 7;
        dateFilter = new Date(now);
        dateFilter.setDate(dateFilter.getDate() - dayOfWeek + 1);
        dateFilter.setHours(0, 0, 0, 0);
        break;
      }
      case 'this_month':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'this_year':
        dateFilter = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all_time':
      default:
        dateFilter = undefined;
        break;
    }

    const [partnerCount, campaignCount, snapshotCount] = await Promise.all([
      db.commercialPartner.count({
        where: dateFilter ? { createdAt: { gte: dateFilter } } : undefined,
      }),
      db.sponsorCampaign.count({
        where: dateFilter ? { createdAt: { gte: dateFilter } } : undefined,
      }),
      db.partnerMetricSnapshot.count({
        where: dateFilter ? { createdAt: { gte: dateFilter } } : undefined,
      }),
    ]);

    return {
      success: true,
      data: {
        period,
        activePartners: partnerCount,
        activeCampaigns: campaignCount,
        metricSnapshots: snapshotCount,
        note: 'Revenue data is aggregated from partner metrics. Detailed financial figures require integration with a billing system.',
        measuredAt: new Date().toISOString(),
      },
    };
  },
};

// 8. get_support_tickets — count of recent support queries
const getSupportTickets: ToolDefinition = {
  name: 'get_support_tickets',
  description: 'Returns the count of recent verification requests and claim requests, used as a proxy for support ticket volume.',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Filter by status. Use "all" for no filter.',
        enum: ['all', 'PENDING', 'APPROVED', 'REJECTED'],
      },
      limit: {
        type: 'number',
        description: 'Max records to return (default 20)',
      },
    },
  },
  requiredPermissions: ['support.tickets.read'],
  riskLevel: RiskLevel.LOW,
  handler: async ({ params }): Promise<ToolResult> => {
    const status = (params.status as string) || 'all';
    const limit = (params.limit as number) || 20;

    const verificationWhere = status !== 'all' ? { status } : {};
    const claimWhere = status !== 'all' ? { status } : {};

    const [verificationCount, claimCount, recentVerifications, recentClaims] =
      await Promise.all([
        db.verificationRequest.count({ where: verificationWhere as Record<string, string> }),
        db.claimRequest.count({ where: claimWhere as Record<string, string> }),
        db.verificationRequest.findMany({
          where: verificationWhere as Record<string, string>,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        }),
        db.claimRequest.findMany({
          where: claimWhere as Record<string, string>,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      success: true,
      data: {
        verificationRequests: {
          total: verificationCount,
          recent: recentVerifications,
        },
        claimRequests: {
          total: claimCount,
          recent: recentClaims,
        },
        totalSupportItems: verificationCount + claimCount,
        measuredAt: new Date().toISOString(),
      },
    };
  },
};

// ═══════════════════════════════════════════════════════════════
// BUILT-IN TOOLS COLLECTION
// ═══════════════════════════════════════════════════════════════

export const BUILT_IN_TOOLS: ToolDefinition[] = [
  getCompanyMetrics,
  getDepartmentMetrics,
  getPlayer,
  getTeam,
  getMatch,
  createTask,
  getRevenueSummary,
  getSupportTickets,
];

/**
 * Create a ToolRegistry pre-loaded with all 8 foundational tools.
 */
export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.registerAll(BUILT_IN_TOOLS);
  return registry;
}

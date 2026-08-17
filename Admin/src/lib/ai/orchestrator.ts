/**
 * SportSphere AI Workforce — Orchestrator
 *
 * The AIOrchestrator coordinates multi-agent workflows.
 * It is the main entry point for the AI workforce system:
 *
 *   - chat({ message, userId, agentId? }) — route a message to an agent
 *   - createTask({ agentId, type, input, priority, userId }) — create a task
 *   - approveTask({ taskId, userId, approved }) — approve/reject a pending task
 *   - getAgentStatus() — summary of all agents
 */

import { db } from '@/lib/db';
import { ProviderRegistry, buildRegistryFromDB } from './provider';
import { createDefaultToolRegistry, ToolRegistry } from './tools';
import { AgentEngine } from './engine';
import {
  TaskStatus,
  TaskPriority,
  type OrchestratorResult,
  type AgentStatusSummary,
  type CreateTaskInput,
  type ApprovalInput,
  type AgentLoadOut,
  type TaskLoadOut,
} from './types';

// ═══════════════════════════════════════════════════════════════
// DEPARTMENT → KEYWORD ROUTING MAP
// ═══════════════════════════════════════════════════════════════

interface RoutingRule {
  department: string;
  role: string;
  keywords: string[];
}

const ROUTING_RULES: RoutingRule[] = [
  {
    department: 'executive',
    role: 'CEO',
    keywords: ['overall', 'company', 'strategy', 'vision', 'business', 'general', 'help', 'what can', 'summary', 'report'],
  },
  {
    department: 'finance',
    role: 'CFO',
    keywords: ['revenue', 'budget', 'cost', 'financial', 'money', 'profit', 'expense', 'billing', 'payment', 'invoice', 'roi'],
  },
  {
    department: 'sports',
    role: 'Sports Director',
    keywords: ['player', 'team', 'match', 'score', 'league', 'transfer', 'sport', 'fixture', 'tournament', 'competition'],
  },
  {
    department: 'content',
    role: 'Content Manager',
    keywords: ['news', 'article', 'post', 'content', 'rumor', 'media', 'social', 'publish', 'draft', 'write'],
  },
  {
    department: 'partnerships',
    role: 'Partnership Director',
    keywords: ['partner', 'sponsor', 'campaign', 'brand', 'deal', 'collaboration', 'advertisement', 'commercial'],
  },
  {
    department: 'community',
    role: 'Community Manager',
    keywords: ['community', 'user', 'moderation', 'comment', 'feedback', 'support', 'ticket', 'engagement', 'member'],
  },
];

// ═══════════════════════════════════════════════════════════════
// AI ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════

export class AIOrchestrator {
  private engine: AgentEngine | null = null;
  private toolRegistry: ToolRegistry;
  private providerRegistry: ProviderRegistry | null = null;
  private registryBuiltAt: number = 0;
  private readonly REGISTRY_TTL_MS = 5 * 60 * 1000; // Re-read DB every 5 min

  constructor(toolRegistry?: ToolRegistry) {
    this.toolRegistry = toolRegistry || createDefaultToolRegistry();
  }

  // ═══════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════

  /**
   * Ensure the provider registry is loaded and engine is ready.
   * Re-reads from DB if the cache has expired.
   */
  private async ensureReady(): Promise<void> {
    const now = Date.now();
    if (this.providerRegistry && this.engine && (now - this.registryBuiltAt) < this.REGISTRY_TTL_MS) {
      return;
    }

    // Load active providers from DB
    const providers = await db.aIProvider.findMany({
      where: { isActive: true },
      select: { name: true, apiKey: true, baseUrl: true, isActive: true },
    });

    this.providerRegistry = buildRegistryFromDB(providers);
    this.engine = new AgentEngine(this.providerRegistry, this.toolRegistry);
    this.registryBuiltAt = now;
  }

  // ═══════════════════════════════════════════════════════
  // MAIN CHAT ENTRY POINT
  // ═══════════════════════════════════════════════════════

  /**
   * Main entry point for the AI workforce.
   * If agentId is specified, route directly to that agent.
   * Otherwise, use keyword-based routing to pick the best agent.
   */
  async chat(params: {
    message: string;
    userId: string;
    agentId?: string;
  }): Promise<OrchestratorResult> {
    await this.ensureReady();

    // ── Resolve agent ────────────────────────────────
    let agent: AgentLoadOut;

    if (params.agentId) {
      agent = await this.loadAgent(params.agentId);
    } else {
      agent = await this.routeToAgent(params.message);
    }

    // ── Create task ──────────────────────────────────
    const task = await this.createTaskInternal({
      agentId: agent.id,
      type: 'chat',
      input: { message: params.message },
      priority: TaskPriority.MEDIUM,
      userId: params.userId,
    });

    // ── Execute ──────────────────────────────────────
    if (!this.engine) {
      throw new Error('Engine not initialized. No AI providers configured in the database.');
    }

    const result = await this.engine.execute({
      agent,
      task: {
        id: task.id,
        agentId: agent.id,
        type: task.type,
        priority: task.priority,
        status: task.status,
        input: task.input as Record<string, unknown>,
        requiresApproval: task.requiresApproval,
        createdById: task.createdById,
      },
      userId: params.userId,
    });

    return {
      taskId: result.taskId,
      agentId: agent.id,
      agentName: agent.name,
      content: result.content,
      status: result.status,
      needsApproval: result.needsApproval,
      approvalDescription: result.approvalDescription,
      costUsd: result.totalCostUsd,
      latencyMs: result.totalLatencyMs,
    };
  }

  // ═══════════════════════════════════════════════════════
  // CREATE TASK
  // ═══════════════════════════════════════════════════════

  async createTask(input: CreateTaskInput): Promise<{
    id: string;
    agentId: string;
    type: string;
    priority: string;
    status: string;
  }> {
    return this.createTaskInternal(input);
  }

  private async createTaskInternal(input: CreateTaskInput): Promise<{
    id: string;
    agentId: string;
    type: string;
    priority: string;
    status: string;
    createdById: string | null;
    input: unknown;
    requiresApproval: boolean;
  }> {
    // Verify agent exists and is active
    const agent = await db.aIAgent.findUnique({
      where: { id: input.agentId },
      select: { id: true, status: true, name: true },
    });

    if (!agent) {
      throw new Error(`Agent not found: "${input.agentId}"`);
    }
    if (agent.status !== 'ACTIVE') {
      throw new Error(`Agent "${agent.name}" is not active (status: ${agent.status})`);
    }

    const task = await db.aIAgentTask.create({
      data: {
        agentId: input.agentId,
        type: input.type,
        priority: input.priority || TaskPriority.MEDIUM,
        input: input.input,
        status: 'QUEUED',
        createdById: input.userId,
      },
    });

    return {
      id: task.id,
      agentId: task.agentId,
      type: task.type,
      priority: task.priority,
      status: task.status,
      createdById: task.createdById,
      input: task.input,
      requiresApproval: task.requiresApproval,
    };
  }

  // ═══════════════════════════════════════════════════════
  // APPROVE / REJECT TASK
  // ═══════════════════════════════════════════════════════

  async approveTask(input: ApprovalInput): Promise<void> {
    const { taskId, userId, approved, response } = input;

    // Load the task
    const task = await db.aIAgentTask.findUnique({
      where: { id: taskId },
      include: {
        approvals: { where: { status: 'PENDING' }, take: 1 },
        agent: { select: { id: true, name: true, status: true } },
      },
    });

    if (!task) {
      throw new Error(`Task not found: "${taskId}"`);
    }

    if (task.status !== 'WAITING_APPROVAL') {
      throw new Error(`Task "${taskId}" is not waiting for approval (status: ${task.status})`);
    }

    if (!approved) {
      // Reject: mark task as failed/cancelled
      await db.aIAgentTask.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.CANCELLED,
          errorMessage: `Rejected by user ${userId}. ${response || ''}`,
          completedAt: new Date(),
        },
      });

      // Update all pending approvals
      if (task.approvals.length > 0) {
        await db.aIAgentApproval.updateMany({
          where: { taskId, status: 'PENDING' },
          data: {
            status: 'REJECTED',
            reviewedById: userId,
            reviewedAt: new Date(),
            response: response || null,
          },
        });
      }
      return;
    }

    // Approve: mark task as completed (it was already processed)
    await db.aIAgentTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    // Update all pending approvals
    if (task.approvals.length > 0) {
      await db.aIAgentApproval.updateMany({
        where: { taskId, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          reviewedById: userId,
          reviewedAt: new Date(),
          response: response || null,
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // AGENT STATUS SUMMARY
  // ═══════════════════════════════════════════════════════

  async getAgentStatus(): Promise<AgentStatusSummary[]> {
    const agents = await db.aIAgent.findMany({
      where: {},
      include: {
        _count: {
          select: {
            tasks: true,
            executions: true,
            auditLogs: true,
          },
        },
        budget: { select: { monthlyLimitUsd: true, spentThisMonthUsd: true, alertThreshold: true } },
        tasks: {
          select: { status: true, tokensUsed: true },
        },
      },
      orderBy: { department: 'asc' },
    });

    return agents.map(agent => {
      const taskCounts = agent.tasks.reduce(
        (acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const totalTokensUsed = agent.tasks.reduce(
        (sum, t) => sum + (t.tokensUsed || 0),
        0,
      );

      // Aggregate cost from executions
      const totalCostUsd = 0; // Would need to sum from AIAgentExecution.costUsd

      return {
        id: agent.id,
        name: agent.name,
        department: agent.department,
        role: agent.role,
        status: agent.status,
        autonomyLevel: agent.autonomyLevel,
        taskCount: agent._count.tasks,
        runningTasks: taskCounts['RUNNING'] || 0,
        failedTasks: taskCounts['FAILED'] || 0,
        completedTasks: taskCounts['COMPLETED'] || 0,
        totalTokensUsed,
        totalCostUsd,
        budgetUsed: agent.budget?.spentThisMonthUsd || 0,
        budgetLimit: agent.budget?.monthlyLimitUsd || 0,
      };
    });
  }

  // ═══════════════════════════════════════════════════════
  // AGENT ROUTING
  // ═══════════════════════════════════════════════════════

  /**
   * Simple keyword-based routing to pick the best agent for a message.
   * Falls back to the CEO/executive agent if no match is found.
   */
  private async routeToAgent(message: string): Promise<AgentLoadOut> {
    const lowerMsg = message.toLowerCase();

    // Score each routing rule
    let bestRule: RoutingRule | null = null;
    let bestScore = 0;

    for (const rule of ROUTING_RULES) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (lowerMsg.includes(kw.toLowerCase())) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestRule = rule;
      }
    }

    // Find an active agent matching the best rule
    const department = bestRule?.department || 'executive';
    const role = bestRule?.role || 'CEO';

    // Try to find exact department+role match first
    let agent = await db.aIAgent.findFirst({
      where: {
        department,
        role,
        status: 'ACTIVE',
      },
      });

    // Fallback: any active agent in the department
    if (!agent) {
      agent = await db.aIAgent.findFirst({
        where: { department, status: 'ACTIVE' },
      });
    }

    // Ultimate fallback: any active agent (prefer CEO/executive)
    if (!agent) {
      agent = await db.aIAgent.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!agent) {
      throw new Error(
        'No active AI agents found. Please configure at least one agent in the AI Workforce settings.',
      );
    }

    return this.enrichAgent(agent);
  }

  // ═══════════════════════════════════════════════════════
  // AGENT LOADING
  // ═══════════════════════════════════════════════════════

  private async loadAgent(agentId: string): Promise<AgentLoadOut> {
    const agent = await db.aIAgent.findUnique({
      where: { id: agentId },
      include: {
        permissions: { select: { permission: true } },
        tools: { select: { toolName: true } },
        budget: { select: { monthlyLimitUsd: true, spentThisMonthUsd: true, alertThreshold: true } },
      },
    });

    if (!agent) {
      throw new Error(`Agent not found: "${agentId}"`);
    }

    return this.enrichAgent(agent);
  }

  private enrichAgent(agent: {
    id: string;
    name: string;
    department: string;
    role: string;
    systemPrompt: string;
    model: string;
    status: string;
    autonomyLevel: number;
    supervisorId: string | null;
    humanOwnerId: string | null;
    permissions?: { permission: string }[];
    tools?: { toolName: string }[];
    budget?: { monthlyLimitUsd: number; spentThisMonthUsd: number; alertThreshold: number } | null;
  }): AgentLoadOut {
    return {
      id: agent.id,
      name: agent.name,
      department: agent.department,
      role: agent.role,
      systemPrompt: agent.systemPrompt,
      model: agent.model,
      status: agent.status,
      autonomyLevel: agent.autonomyLevel,
      supervisorId: agent.supervisorId,
      humanOwnerId: agent.humanOwnerId,
      permissions: (agent.permissions || []).map(p => p.permission),
      toolNames: (agent.tools || []).map(t => t.toolName),
      budget: agent.budget
        ? {
            monthlyLimitUsd: agent.budget.monthlyLimitUsd,
            spentThisMonthUsd: agent.budget.spentThisMonthUsd,
            alertThreshold: agent.budget.alertThreshold,
          }
        : null,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let _orchestrator: AIOrchestrator | null = null;

/**
 * Get the singleton AIOrchestrator instance.
 * Safe to call from server-side code (API routes, server actions, etc.)
 */
export function getOrchestrator(toolRegistry?: ToolRegistry): AIOrchestrator {
  if (!_orchestrator) {
    _orchestrator = new AIOrchestrator(toolRegistry);
  }
  return _orchestrator;
}

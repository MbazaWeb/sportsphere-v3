/**
 * SportSphere AI Workforce — Agent Execution Engine
 *
 * The AgentEngine handles the full lifecycle of a single task:
 *   1. Load agent & validate status / budget
 *   2. Check permissions
 *   3. Build message history (system + user input)
 *   4. Call the AI provider (with tools)
 *   5. Handle tool calls in a loop (max 5 rounds)
 *   6. Store messages, execution records, and update task status
 *   7. Check if the result needs approval based on autonomy level
 *   8. Return a structured TaskResult
 */

import { db } from '@/lib/db';
import type { ProviderRegistry } from './provider';
import type { ToolRegistry } from './tools';
import { PermissionChecker } from './permissions';
import {
  AgentStatus,
  TaskStatus,
  ExecutionStatus,
  RiskLevel,
  AutonomyLevel,
  type AgentLoadOut,
  type TaskLoadOut,
  type TaskResult,
  type ExecutionRecord,
  type ChatMessage,
  type ToolCall,
  type ModelPricing,
  getModelPricing,
  calculateCost,
} from './types';

const MAX_TOOL_ROUNDS = 5;
const MAX_RETRIES = 1;

export class AgentEngine {
  private providerRegistry: ProviderRegistry;
  private toolRegistry: ToolRegistry;

  constructor(providerRegistry: ProviderRegistry, toolRegistry: ToolRegistry) {
    this.providerRegistry = providerRegistry;
    this.toolRegistry = toolRegistry;
  }

  /**
   * Execute a task for a given agent.
   * This is the main entry point — call from orchestrator or API route.
   */
  async execute(params: {
    agent: AgentLoadOut;
    task: TaskLoadOut;
    userId: string;
  }): Promise<TaskResult> {
    const { agent, task, userId } = params;

    // ── 1. Validate agent status ──────────────────────────
    if (agent.status !== AgentStatus.ACTIVE) {
      await this.failTask(task.id, `Agent "${agent.name}" is not active (status: ${agent.status})`);
      return this.errorResult(task.id, `Agent "${agent.name}" is not active`);
    }

    // ── 2. Check budget ────────────────────────────────────
    if (agent.budget) {
      const pct = agent.budget.spentThisMonthUsd / agent.budget.monthlyLimitUsd;
      if (pct >= 1) {
        await this.failTask(task.id, `Agent "${agent.name}" has exceeded its monthly budget`);
        return this.errorResult(task.id, `Budget exceeded for agent "${agent.name}"`);
      }
    }

    // ── 3. Set task to RUNNING ─────────────────────────────
    await db.aIAgentTask.update({
      where: { id: task.id },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    // ── 4. Build messages ─────────────────────────────────
    const messages: ChatMessage[] = [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: this.buildUserMessage(task) },
    ];

    // ── 5. Determine available tools ───────────────────────
    const permissionChecker = new PermissionChecker(agent.permissions);
    const providerTools = this.toolRegistry.getToolsForAgent(
      agent.toolNames,
      agent.permissions,
    );

    // ── 6. Get provider and pricing ────────────────────────
    let provider;
    try {
      provider = this.providerRegistry.getForModel(agent.model);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.failTask(task.id, msg);
      return this.errorResult(task.id, msg);
    }

    const pricing = await this.getModelPricingFromDB(agent.model);

    // ── 7. Execution loop (tool call rounds) ──────────────
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;
    let totalLatencyMs = 0;
    let totalToolCalls = 0;
    let finalContent = '';
    let needsApproval = false;
    let approvalDescription: string | undefined;
    let executionRecords: ExecutionRecord[] = [];

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        // Store all messages so far in DB
        await this.storeMessages(task.id, messages);

        // Call the provider (with retry)
        const result = await this.callProviderWithRetry(
          provider,
          messages,
          agent.model,
          providerTools.length > 0 ? providerTools : undefined,
        );

        totalInputTokens += result.inputTokens;
        totalOutputTokens += result.outputTokens;
        totalLatencyMs += result.latencyMs;
        totalCostUsd += calculateCost(result.inputTokens, result.outputTokens, pricing);

        // Record execution
        const execRecord = await this.recordExecution({
          taskId: task.id,
          agentId: agent.id,
          model: agent.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          costUsd: calculateCost(result.inputTokens, result.outputTokens, pricing),
          latencyMs: result.latencyMs,
          status: ExecutionStatus.SUCCESS,
          toolCalls: result.toolCalls || [],
        });
        executionRecords.push(execRecord);

        // Append assistant message
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: result.content,
          toolCalls: result.toolCalls,
        };
        messages.push(assistantMsg);
        await this.storeMessage(task.id, {
          role: 'ASSISTANT',
          content: result.content,
          toolCalls: result.toolCalls,
        });

        // If no tool calls, we're done
        if (!result.toolCalls || result.toolCalls.length === 0) {
          finalContent = result.content;
          break;
        }

        // Process each tool call
        for (const tc of result.toolCalls) {
          totalToolCalls++;

          // Check permissions for this tool
          const toolDef = this.toolRegistry.get(tc.name);
          const toolRisk = toolDef
            ? this.toolRegistry.getRiskLevel(tc.name)
            : RiskLevel.MEDIUM;

          if (toolDef && !permissionChecker.checkAll(toolDef.requiredPermissions)) {
            const errorMsg = `Agent lacks permissions for tool "${tc.name}". Required: ${toolDef.requiredPermissions.join(', ')}`;
            messages.push({
              role: 'tool',
              content: JSON.stringify({ error: errorMsg }),
              toolCallId: tc.id,
              name: tc.name,
            });
            await this.storeMessage(task.id, {
              role: 'TOOL',
              content: JSON.stringify({ error: errorMsg }),
              toolName: tc.name,
              toolCallId: tc.id,
            });
            continue;
          }

          // Check if this tool action needs approval based on autonomy level
          const actionNeedsApproval = this.shouldRequireApproval(
            agent.autonomyLevel,
            toolRisk,
          );

          if (actionNeedsApproval && !toolDef) {
            // Unknown tool at high risk — needs approval
            needsApproval = true;
            approvalDescription = `Tool call "${tc.name}" requires approval (risk: ${toolRisk}, autonomy: ${agent.autonomyLevel})`;
            messages.push({
              role: 'tool',
              content: JSON.stringify({
                error: 'Action requires human approval before execution.',
                approvalRequired: true,
              }),
              toolCallId: tc.id,
              name: tc.name,
            });
            await this.storeMessage(task.id, {
              role: 'TOOL',
              content: JSON.stringify({ error: 'Action requires human approval.' }),
              toolName: tc.name,
              toolCallId: tc.id,
            });
            continue;
          }

          if (actionNeedsApproval) {
            // Create approval record
            await db.aIAgentApproval.create({
              data: {
                taskId: task.id,
                agentId: agent.id,
                action: `tool:${tc.name}`,
                description: `Agent wants to call tool "${tc.name}" with risk level ${toolRisk}`,
                riskLevel: toolRisk,
                status: 'PENDING',
                requestedById: userId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
              },
            });
            needsApproval = true;
            approvalDescription = `Tool "${tc.name}" requires approval (risk: ${toolRisk})`;
            messages.push({
              role: 'tool',
              content: JSON.stringify({
                error: 'Action requires human approval. An approval request has been created.',
                approvalRequired: true,
              }),
              toolCallId: tc.id,
              name: tc.name,
            });
            await this.storeMessage(task.id, {
              role: 'TOOL',
              content: JSON.stringify({ error: 'Requires approval.' }),
              toolName: tc.name,
              toolCallId: tc.id,
            });
            continue;
          }

          // Execute the tool
          let parsedArgs: Record<string, unknown>;
          try {
            parsedArgs = JSON.parse(tc.arguments);
          } catch {
            parsedArgs = {};
          }

          const toolResult = await this.toolRegistry.execute(tc.name, {
            params: parsedArgs,
            agentId: agent.id,
            userId,
            taskId: task.id,
          });

          const resultContent = JSON.stringify(
            toolResult.success ? toolResult.data : { error: toolResult.error },
          );

          messages.push({
            role: 'tool',
            content: resultContent,
            toolCallId: tc.id,
            name: tc.name,
          });
          await this.storeMessage(task.id, {
            role: 'TOOL',
            content: resultContent,
            toolName: tc.name,
            toolCallId: tc.id,
          });

          // If tool result says it needs approval, flag it
          if (toolResult.requiresApproval) {
            needsApproval = true;
            approvalDescription = toolResult.approvalDescription;
          }

          // Audit log
          await db.aIAgentAuditLog.create({
            data: {
              agentId: agent.id,
              taskId: task.id,
              action: `tool:${tc.name}`,
              tool: tc.name,
              inputSnapshot: parsedArgs,
              outputSnapshot: toolResult.success ? toolResult.data : undefined,
              riskLevel: toolRisk,
              userId,
            },
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.failTask(task.id, msg);
      return this.errorResult(task.id, msg);
    }

    // ── 8. Update budget ───────────────────────────────────
    if (agent.budget) {
      await db.aIAgentBudget.update({
        where: { agentId: agent.id },
        data: { spentThisMonthUsd: { increment: totalCostUsd } },
      });
    }

    // ── 9. Record AI usage ─────────────────────────────────
    try {
      await this.recordUsage({
        model: agent.model,
        agentId: agent.id,
        taskId: task.id,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        costUsd: totalCostUsd,
        latencyMs: totalLatencyMs,
        userId,
        department: agent.department,
      });
    } catch {
      // Non-critical: don't fail the task if usage recording fails
    }

    // ── 10. Complete task ──────────────────────────────────
    const finalStatus = needsApproval ? TaskStatus.WAITING_APPROVAL : TaskStatus.COMPLETED;

    await db.aIAgentTask.update({
      where: { id: task.id },
      data: {
        status: finalStatus,
        result: {
          content: finalContent,
          toolCallsCount: totalToolCalls,
        },
        completedAt: new Date(),
        tokensUsed: totalInputTokens + totalOutputTokens,
        costEstimate: totalCostUsd,
        requiresApproval: needsApproval,
      },
    });

    return {
      taskId: task.id,
      status: finalStatus,
      content: finalContent,
      totalInputTokens,
      totalOutputTokens,
      totalCostUsd,
      totalLatencyMs,
      toolCallsCount: totalToolCalls,
      needsApproval,
      approvalDescription,
    };
  }

  // ═══════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════

  private buildUserMessage(task: TaskLoadOut): string {
    const parts = [`[Task Type: ${task.type}]`, `[Priority: ${task.priority}]`];

    const input = task.input;
    if (input && typeof input === 'object' && Object.keys(input).length > 0) {
      parts.push(`[Task Input]:\n${JSON.stringify(input, null, 2)}`);
    } else if (typeof input === 'string' && input.trim()) {
      parts.push(`[Task Input]: ${input}`);
    }

    return parts.join('\n');
  }

  private async callProviderWithRetry(
    provider: import('./provider').AIProviderInterface,
    messages: ChatMessage[],
    model: string,
    tools?: import('./provider').ProviderToolDef[],
    retryCount: number = MAX_RETRIES,
  ): Promise<import('./types').ProviderChatResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        return await provider.chat(messages, model, tools);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Only retry on timeout or transient errors
        const isRetryable =
          lastError.message.includes('abort') ||
          lastError.message.includes('timeout') ||
          lastError.message.includes('503') ||
          lastError.message.includes('502') ||
          lastError.message.includes('429');
        if (!isRetryable || attempt === retryCount) throw lastError;
        // Exponential backoff: 1s, 2s
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    throw lastError || new Error('Provider call failed after retries');
  }

  private shouldRequireApproval(
    autonomyLevel: number,
    riskLevel: RiskLevel,
  ): boolean {
    switch (autonomyLevel) {
      case AutonomyLevel.NONE:
        return true; // Everything needs approval
      case AutonomyLevel.LOW:
        return true; // Everything needs approval
      case AutonomyLevel.MEDIUM:
        return riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL;
      case AutonomyLevel.HIGH:
        return riskLevel === RiskLevel.CRITICAL;
      case AutonomyLevel.FULL:
        return false; // Nothing needs approval
      default:
        return true;
    }
  }

  private async storeMessage(
    taskId: string,
    msg: {
      role: string;
      content: string;
      toolName?: string;
      toolCallId?: string;
      toolCalls?: ToolCall[];
    },
  ): Promise<void> {
    await db.aIAgentMessage.create({
      data: {
        taskId,
        role: msg.role,
        content: msg.toolCalls ? JSON.stringify(msg.toolCalls) : msg.content,
        toolName: msg.toolName,
        toolCallId: msg.toolCallId,
      },
    });
  }

  private async storeMessages(taskId: string, messages: ChatMessage[]): Promise<void> {
    // Only store messages that aren't already stored (we store inline during the loop).
    // This is a no-op in the main loop since we store as we go.
  }

  private async recordExecution(params: {
    taskId: string;
    agentId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    latencyMs: number;
    status: ExecutionStatus;
    toolCalls: ToolCall[];
    errorMessage?: string;
  }): Promise<ExecutionRecord> {
    const record = await db.aIAgentExecution.create({
      data: {
        taskId: params.taskId,
        agentId: params.agentId,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        totalTokens: params.inputTokens + params.outputTokens,
        costUsd: params.costUsd,
        latencyMs: params.latencyMs,
        status: params.status,
        errorMessage: params.errorMessage,
        toolCalls: params.toolCalls,
      },
    });

    return {
      taskId: record.taskId,
      agentId: record.agentId,
      model: record.model,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      totalTokens: record.totalTokens,
      costUsd: record.costUsd,
      latencyMs: record.latencyMs,
      status: record.status as ExecutionStatus,
      errorMessage: record.errorMessage || undefined,
      toolCalls: record.toolCalls as ToolCall[],
    };
  }

  private async recordUsage(params: {
    model: string;
    agentId: string;
    taskId: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    latencyMs: number;
    userId: string;
    department: string;
  }): Promise<void> {
    // Look up the provider and model from DB
    const modelRecord = await db.aIModel.findUnique({
      where: { modelId: params.model },
      select: { providerId: true },
    });

    if (!modelRecord) return;

    await db.aIUsage.create({
      data: {
        providerId: modelRecord.providerId,
        modelId: params.model,
        agentId: params.agentId,
        taskId: params.taskId,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        costUsd: params.costUsd,
        latencyMs: params.latencyMs,
        userId: params.userId,
        department: params.department,
      },
    });
  }

  private async failTask(taskId: string, errorMessage: string): Promise<void> {
    await db.aIAgentTask.update({
      where: { id: taskId },
      data: {
        status: 'FAILED',
        errorMessage,
        completedAt: new Date(),
      },
    }).catch(() => {
 // Ignore if the update fails (task may already be in a terminal state)
    });
  }

  private async getModelPricingFromDB(modelId: string): Promise<ModelPricing> {
    try {
      const model = await db.aIModel.findUnique({
        where: { modelId },
        select: { inputCostPer1k: true, outputCostPer1k: true },
      });
      if (model) {
        return {
          inputCostPer1k: model.inputCostPer1k,
          outputCostPer1k: model.outputCostPer1k,
        };
      }
    } catch {
      // Fall back to default pricing
    }
    return getModelPricing(modelId);
  }

  private errorResult(taskId: string, error: string): TaskResult {
    return {
      taskId,
      status: TaskStatus.FAILED,
      content: '',
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      totalLatencyMs: 0,
      toolCallsCount: 0,
      needsApproval: false,
      error,
    };
  }
}

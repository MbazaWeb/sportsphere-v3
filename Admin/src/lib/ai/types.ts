/**
 * SportSphere AI Workforce — Shared Types & Enums
 *
 * All TypeScript types/interfaces matching the Prisma models for the
 * AI Agent platform, plus provider response interfaces and enums.
 */

// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DISABLED = 'DISABLED',
}

export enum TaskStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  ESCALATED = 'ESCALATED',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AutonomyLevel {
  NONE = 0,          // Every action requires approval
  LOW = 1,           // Read-only, no writes without approval
  MEDIUM = 2,        // Low-risk writes auto-approved
  HIGH = 3,          // Most actions auto-approved, high-risk gated
  FULL = 4,          // Full autonomy, only critical actions gated
}

export enum ExecutionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

export enum MessageRole {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  TOOL = 'TOOL',
}

export enum AlertType {
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  AGENT_FAILURE = 'AGENT_FAILURE',
  SECURITY_EVENT = 'SECURITY_EVENT',
  HIGH_COST = 'HIGH_COST',
  ESCALATION = 'ESCALATION',
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum KnowledgeSourceType {
  POLICY = 'POLICY',
  SOP = 'SOP',
  MANUAL = 'MANUAL',
  CONTRACT = 'CONTRACT',
  FAQ = 'FAQ',
  STRATEGY = 'STRATEGY',
}

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
}

export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
  name?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string; // JSON string
}

export interface ProviderChatResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  latencyMs: number;
  toolCalls?: ToolCall[];
}

export interface ProviderEmbedResult {
  embedding: number[];
  inputTokens: number;
  model: string;
  latencyMs: number;
}

export interface ModelPricing {
  inputCostPer1k: number;
  outputCostPer1k: number;
}

// ═══════════════════════════════════════════════════════════════
// TOOL FRAMEWORK TYPES
// ═══════════════════════════════════════════════════════════════

export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
 default?: unknown;
  properties?: Record<string, ToolParameterSchema>;
  required?: string[];
  items?: ToolParameterSchema;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameterSchema>;
    required?: string[];
  };
  requiredPermissions: string[];
  riskLevel: RiskLevel;
  handler: (context: ToolContext) => Promise<ToolResult>;
}

export interface ToolContext {
  params: Record<string, unknown>;
  agentId: string;
  userId: string;
  taskId?: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  requiresApproval?: boolean;
  approvalDescription?: string;
}

// ═══════════════════════════════════════════════════════════════
// ENGINE TYPES
// ═══════════════════════════════════════════════════════════════

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  content: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  totalLatencyMs: number;
  toolCallsCount: number;
  needsApproval: boolean;
  approvalDescription?: string;
  error?: string;
}

export interface ExecutionRecord {
  taskId: string;
  agentId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs: number;
  status: ExecutionStatus;
  errorMessage?: string;
  toolCalls: ToolCall[];
}

// ═══════════════════════════════════════════════════════════════
// ORCHESTRATOR TYPES
// ═══════════════════════════════════════════════════════════════

export interface OrchestratorResult {
  taskId: string;
  agentId: string;
  agentName: string;
  content: string;
  status: TaskStatus;
  needsApproval: boolean;
  approvalDescription?: string;
  costUsd: number;
  latencyMs: number;
}

export interface AgentStatusSummary {
  id: string;
  name: string;
  department: string;
  role: string;
  status: string;
 autonomyLevel: number;
 taskCount: number;
 runningTasks: number;
 failedTasks: number;
 completedTasks: number;
 totalTokensUsed: number;
  totalCostUsd: number;
 budgetUsed: number;
  budgetLimit: number;
}

export interface CreateTaskInput {
  agentId: string;
  type: string;
  input: Record<string, unknown>;
  priority?: TaskPriority;
  userId: string;
}

export interface ApprovalInput {
  taskId: string;
  userId: string;
  approved: boolean;
  response?: string;
}

// ═══════════════════════════════════════════════════════════════
// AGENT LOAD OUT (lightweight for engine use)
// ═══════════════════════════════════════════════════════════════

export interface AgentLoadOut {
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
  permissions: string[];
  toolNames: string[];
  budget: {
    monthlyLimitUsd: number;
    spentThisMonthUsd: number;
    alertThreshold: number;
  } | null;
}

export interface TaskLoadOut {
  id: string;
  agentId: string;
  type: string;
  priority: string;
  status: string;
  input: Record<string, unknown>;
  requiresApproval: boolean;
  createdById: string | null;
}

// ═══════════════════════════════════════════════════════════════
// COST CALCULATION HELPERS
// ═══════════════════════════════════════════════════════════════

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricing
): number {
  return (inputTokens / 1000) * pricing.inputCostPer1k + (outputTokens / 1000) * pricing.outputCostPer1k;
}

/**
 * Default cost table for common models when DB pricing is not available.
 * Prices in USD per 1K tokens.
 */
export const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4o-mini': { inputCostPer1k: 0.00015, outputCostPer1k: 0.0006 },
  'gpt-4o': { inputCostPer1k: 0.0025, outputCostPer1k: 0.01 },
  'gpt-4-turbo': { inputCostPer1k: 0.01, outputCostPer1k: 0.03 },
  'gpt-4': { inputCostPer1k: 0.03, outputCostPer1k: 0.06 },
  'gpt-3.5-turbo': { inputCostPer1k: 0.0005, outputCostPer1k: 0.0015 },
  'claude-3-5-sonnet-20241022': { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
  'claude-3-haiku-20240307': { inputCostPer1k: 0.00025, outputCostPer1k: 0.00125 },
  'claude-3-opus-20240229': { inputCostPer1k: 0.015, outputCostPer1k: 0.075 },
  'gemini-1.5-pro': { inputCostPer1k: 0.00125, outputCostPer1k: 0.005 },
  'gemini-1.5-flash': { inputCostPer1k: 0.000075, outputCostPer1k: 0.0003 },
};

export function getModelPricing(modelId: string): ModelPricing {
  if (DEFAULT_MODEL_PRICING[modelId]) return DEFAULT_MODEL_PRICING[modelId];
  // Safe fallback for unknown models
  return { inputCostPer1k: 0.002, outputCostPer1k: 0.008 };
}

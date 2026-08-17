/**
 * Seed script for SportSphere's AI Workforce.
 *
 * Creates (or updates) the founding AI providers, models, agents,
 * agent tools, permissions, budgets, and knowledge sources.
 *
 * Safe to run multiple times — all operations use upsert.
 *
 * Usage:
 *   npx tsx prisma/seed-ai-workforce.ts
 */

import { db } from '../src/lib/db';

// Deterministic UUIDs so upsert is truly idempotent across runs
const PROVIDER_IDS = {
  openai: 'a0000000-0000-4000-a000-000000000001',
  anthropic: 'a0000000-0000-4000-a000-000000000002',
  google: 'a0000000-0000-4000-a000-000000000003',
} as const;

const MODEL_IDS = {
  'gpt-4o-mini': 'b0000000-0000-4000-b000-000000000001',
  'gpt-4o': 'b0000000-0000-4000-b000-000000000002',
  'claude-sonnet-4-20250514': 'b0000000-0000-4000-b000-000000000003',
  'claude-haiku-4-20250414': 'b0000000-0000-4000-b000-000000000004',
  'gemini-2.0-flash': 'b0000000-0000-4000-b000-000000000005',
} as const;

const AGENT_IDS = {
  ceo: 'c0000000-0000-4000-c000-000000000001',
  cfo: 'c0000000-0000-4000-c000-000000000002',
  sportsDirector: 'c0000000-0000-4000-c000-000000000003',
  salesDirector: 'c0000000-0000-4000-c000-000000000004',
  marketingDirector: 'c0000000-0000-4000-c000-000000000005',
  supportManager: 'c0000000-0000-4000-c000-000000000006',
} as const;

const KNOWLEDGE_IDS = {
  companyOverview: 'd0000000-0000-4000-d000-000000000001',
  escalationPolicy: 'd0000000-0000-4000-d000-000000000002',
} as const;

// ─── Provider Definitions ───────────────────────────────────────────

const providers = [
  {
    id: PROVIDER_IDS.openai,
    name: 'openai',
    displayName: 'OpenAI',
    apiKey: 'sk-placeholder',
    baseUrl: 'https://api.openai.com/v1',
    isActive: true,
  },
  {
    id: PROVIDER_IDS.anthropic,
    name: 'anthropic',
    displayName: 'Anthropic',
    apiKey: 'sk-ant-placeholder',
    baseUrl: 'https://api.anthropic.com/v1',
    isActive: true,
  },
  {
    id: PROVIDER_IDS.google,
    name: 'google',
    displayName: 'Google AI',
    apiKey: 'placeholder',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    isActive: true,
  },
];

// ─── Model Definitions ──────────────────────────────────────────────

const models = [
  {
    id: MODEL_IDS['gpt-4o-mini'],
    providerId: PROVIDER_IDS.openai,
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    maxTokens: 16384,
    isActive: true,
  },
  {
    id: MODEL_IDS['gpt-4o'],
    providerId: PROVIDER_IDS.openai,
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
    maxTokens: 128000,
    isActive: true,
  },
  {
    id: MODEL_IDS['claude-sonnet-4-20250514'],
    providerId: PROVIDER_IDS.anthropic,
    modelId: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    maxTokens: 200000,
    isActive: true,
  },
  {
    id: MODEL_IDS['claude-haiku-4-20250414'],
    providerId: PROVIDER_IDS.anthropic,
    modelId: 'claude-haiku-4-20250414',
    displayName: 'Claude Haiku 4',
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00125,
    maxTokens: 200000,
    isActive: true,
  },
  {
    id: MODEL_IDS['gemini-2.0-flash'],
    providerId: PROVIDER_IDS.google,
    modelId: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    inputCostPer1k: 0.000075,
    outputCostPer1k: 0.0003,
    maxTokens: 1048576,
    isActive: true,
  },
];

// ─── Agent Definitions ──────────────────────────────────────────────

type AgentDef = {
  id: string;
  name: string;
  role: string;
  department: string;
  description: string;
  systemPrompt: string;
  model: string;
  autonomyLevel: number;
  status: string;
  supervisorId?: string;
  permissions: string[];
  tools: { toolName: string; description: string }[];
  budget: number;
};

const agents: AgentDef[] = [
  {
    id: AGENT_IDS.ceo,
    name: 'AI CEO',
    role: 'Chief Executive Officer',
    department: 'Executive Office',
    description:
      'SportSphere\'s AI CEO monitors all company KPIs and produces executive briefs.',
    systemPrompt:
      "You are SportSphere's AI CEO. Monitor all company KPIs: revenue, users, growth, sales, marketing, customer service, HR, product, technology, and risk. Produce daily executive briefs, weekly reviews, and strategic recommendations. Always cite your data sources. When uncertain, escalate to human executives.",
    model: 'gpt-4o',
    autonomyLevel: 1,
    status: 'ACTIVE',
    permissions: [
      'company.*',
      'finance.*',
      'sales.*',
      'marketing.*',
      'sports.*',
      'hr.*',
      'support.*',
      'technology.*',
    ],
    tools: [
      { toolName: 'get_company_metrics', description: 'Retrieve top-level company KPIs' },
      { toolName: 'get_department_metrics', description: 'Retrieve metrics for a specific department' },
      { toolName: 'create_task', description: 'Create a task for any agent' },
    ],
    budget: 100,
  },
  {
    id: AGENT_IDS.cfo,
    name: 'AI CFO',
    role: 'Chief Financial Officer',
    department: 'Finance',
    description:
      'SportSphere\'s AI CFO monitors revenue, expenses, budgets, and cash-flow.',
    systemPrompt:
      "You are SportSphere's AI CFO. Monitor revenue, expenses, budgets, cash-flow, invoices, accounts receivable/payable. Detect financial anomalies and unusual spending. NEVER transfer money autonomously. All financial actions require human approval.",
    model: 'gpt-4o',
    autonomyLevel: 1,
    status: 'ACTIVE',
    permissions: ['finance.*', 'company.metrics.read'],
    tools: [
      { toolName: 'get_company_metrics', description: 'Retrieve top-level company KPIs' },
      { toolName: 'get_revenue_summary', description: 'Retrieve revenue breakdown and trends' },
      { toolName: 'create_task', description: 'Create a task for any agent' },
    ],
    budget: 50,
  },
  {
    id: AGENT_IDS.sportsDirector,
    name: 'AI Sports Director',
    role: 'Sports Director',
    department: 'Sports Operations',
    description:
      'SportSphere\'s AI Sports Director analyzes player, team, and competition performance.',
    systemPrompt:
      "You are SportSphere's AI Sports Director. Analyze player performance, team performance, competitions, and rankings. Detect emerging talent and unusual results. Generate scouting reports. Monitor data quality. Always back recommendations with real data.",
    model: 'gpt-4o',
    autonomyLevel: 2,
    status: 'ACTIVE',
    permissions: ['sports.*'],
    tools: [
      { toolName: 'get_player', description: 'Retrieve player profile and stats' },
      { toolName: 'get_team', description: 'Retrieve team profile and stats' },
      { toolName: 'get_match', description: 'Retrieve match details and results' },
      { toolName: 'get_company_metrics', description: 'Retrieve top-level company KPIs' },
      { toolName: 'create_task', description: 'Create a task for any agent' },
    ],
    budget: 60,
  },
  {
    id: AGENT_IDS.salesDirector,
    name: 'AI Sales Director',
    role: 'Sales Director',
    department: 'Sales',
    description:
      'SportSphere\'s AI Sales Director manages the sales pipeline and lead analysis.',
    systemPrompt:
      "You are SportSphere's AI Sales Director. Manage the sales pipeline, analyze leads, identify hot/cold leads, stalled opportunities, and upsell chances. Create follow-up tasks. External communication requires human approval.",
    model: 'gpt-4o-mini',
    autonomyLevel: 2,
    status: 'ACTIVE',
    permissions: ['sales.*', 'company.metrics.read'],
    tools: [
      { toolName: 'get_company_metrics', description: 'Retrieve top-level company KPIs' },
      { toolName: 'get_department_metrics', description: 'Retrieve metrics for a specific department' },
      { toolName: 'create_task', description: 'Create a task for any agent' },
    ],
    budget: 40,
  },
  {
    id: AGENT_IDS.marketingDirector,
    name: 'AI Marketing Director',
    role: 'Marketing Director',
    department: 'Marketing',
    description:
      'SportSphere\'s AI Marketing Director monitors campaigns, acquisition, and ROI.',
    systemPrompt:
      "You are SportSphere's AI Marketing Director. Monitor campaigns, user acquisition, retention, social media, and ROI. Recommend actions based on real performance data. Content requires approval before publication.",
    model: 'gpt-4o-mini',
    autonomyLevel: 2,
    status: 'ACTIVE',
    permissions: ['marketing.*', 'company.metrics.read'],
    tools: [
      { toolName: 'get_company_metrics', description: 'Retrieve top-level company KPIs' },
      { toolName: 'get_department_metrics', description: 'Retrieve metrics for a specific department' },
      { toolName: 'create_task', description: 'Create a task for any agent' },
    ],
    budget: 40,
  },
  {
    id: AGENT_IDS.supportManager,
    name: 'AI Support Manager',
    role: 'Support Manager',
    department: 'Customer Service',
    description:
      'SportSphere\'s AI Support Manager resolves customer issues and creates tickets.',
    systemPrompt:
      "You are SportSphere's AI Support Manager. Understand customer questions, search account info, check subscriptions/payments, create support tickets, and resolve permitted issues. Escalate complex or sensitive issues to human agents.",
    model: 'claude-haiku-4-20250414',
    autonomyLevel: 3,
    status: 'ACTIVE',
    permissions: ['support.*', 'company.metrics.read', 'users.read'],
    tools: [
      { toolName: 'get_company_metrics', description: 'Retrieve top-level company KPIs' },
      { toolName: 'get_support_tickets', description: 'Search and retrieve support tickets' },
      { toolName: 'create_task', description: 'Create a task for any agent' },
    ],
    budget: 30,
  },
];

// ─── Knowledge Source Definitions ────────────────────────────────────

const knowledgeSources = [
  {
    id: KNOWLEDGE_IDS.companyOverview,
    title: 'SportSphere Company Overview',
    type: 'STRATEGY',
    department: 'Executive Office',
    content:
      'SportSphere is a comprehensive sports platform serving fans, athletes, and organizations across East Africa and beyond. Our mission is to democratize sports data and community engagement. Key verticals include football, rugby, cricket, and athletics. We monetize through premium subscriptions, partnerships, and advertising.',
    isActive: true,
  },
  {
    id: KNOWLEDGE_IDS.escalationPolicy,
    title: 'Customer Support Escalation Policy',
    type: 'POLICY',
    department: 'Customer Service',
    content:
      'All customer support issues must be triaged by severity. Low-severity issues (account questions, FAQ) may be resolved autonomously by the AI Support Manager. Medium-severity issues (billing disputes, account recovery) require human review within 4 hours. High-severity issues (security breaches, data requests, legal) must be escalated immediately to the human support team with a P1 priority.',
    isActive: true,
  },
];

// ─── Main Seed Function ─────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding SportSphere AI Workforce...\n');

  const summary = { providers: 0, models: 0, agents: 0, tools: 0, permissions: 0, budgets: 0, knowledge: 0 };

  // 1. ── AI Providers ──────────────────────────────────────────────
  console.log('── AI Providers ──');
  for (const p of providers) {
    const provider = await db.aIProvider.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        displayName: p.displayName,
        apiKey: p.apiKey,
        baseUrl: p.baseUrl,
        isActive: p.isActive,
      },
      create: p,
    });
    console.log(`  ✅ ${provider.displayName} (${provider.name})`);
    summary.providers++;
  }

  // 2. ── AI Models ─────────────────────────────────────────────────
  console.log('\n── AI Models ──');
  for (const m of models) {
    const model = await db.aIModel.upsert({
      where: { id: m.id },
      update: {
        providerId: m.providerId,
        modelId: m.modelId,
        displayName: m.displayName,
        inputCostPer1k: m.inputCostPer1k,
        outputCostPer1k: m.outputCostPer1k,
        maxTokens: m.maxTokens,
        isActive: m.isActive,
      },
      create: m,
    });
    console.log(`  ✅ ${model.displayName} (${model.modelId})`);
    summary.models++;
  }

  // 3. ── AI Agents (+ Permissions, Tools, Budgets) ─────────────────
  console.log('\n── AI Agents ──');
  for (const a of agents) {
    // Upsert the agent itself
    const agent = await db.aIAgent.upsert({
      where: { id: a.id },
      update: {
        name: a.name,
        role: a.role,
        department: a.department,
        description: a.description,
        systemPrompt: a.systemPrompt,
        model: a.model,
        autonomyLevel: a.autonomyLevel,
        status: a.status,
        supervisorId: a.supervisorId ?? null,
      },
      create: {
        id: a.id,
        name: a.name,
        role: a.role,
        department: a.department,
        description: a.description,
        systemPrompt: a.systemPrompt,
        model: a.model,
        autonomyLevel: a.autonomyLevel,
        status: a.status,
        supervisorId: a.supervisorId ?? null,
      },
    });
    console.log(`  ✅ ${agent.name} — ${agent.role} (${agent.department})`);
    summary.agents++;

    // Delete existing tools & permissions for this agent so we can re-seed cleanly
    await db.aIAgentTool.deleteMany({ where: { agentId: a.id } });
    await db.aIAgentPermission.deleteMany({ where: { agentId: a.id } });

    // Seed tools
    for (const t of a.tools) {
      await db.aIAgentTool.create({
        data: {
          agentId: a.id,
          toolName: t.toolName,
          description: t.description,
        },
      });
      summary.tools++;
    }

    // Seed permissions
    for (const perm of a.permissions) {
      await db.aIAgentPermission.create({
        data: {
          agentId: a.id,
          permission: perm,
        },
      });
      summary.permissions++;
    }

    // Upsert budget
    await db.aIAgentBudget.upsert({
      where: { agentId: a.id },
      update: { monthlyLimitUsd: a.budget },
      create: { agentId: a.id, monthlyLimitUsd: a.budget },
    });
    summary.budgets++;
  }

  // 4. ── Knowledge Sources ─────────────────────────────────────────
  console.log('\n── Knowledge Sources ──');
  for (const k of knowledgeSources) {
    const ks = await db.aIKnowledgeSource.upsert({
      where: { id: k.id },
      update: {
        title: k.title,
        type: k.type,
        department: k.department,
        content: k.content,
        isActive: k.isActive,
      },
      create: k,
    });
    console.log(`  ✅ ${ks.title} [${ks.type}]`);
    summary.knowledge++;
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log('  SportSphere AI Workforce Seeded Successfully!');
  console.log('═'.repeat(50));
  console.log(`  Providers:   ${summary.providers}`);
  console.log(`  Models:      ${summary.models}`);
  console.log(`  Agents:      ${summary.agents}`);
  console.log(`  Tools:       ${summary.tools}`);
  console.log(`  Permissions: ${summary.permissions}`);
  console.log(`  Budgets:     ${summary.budgets}`);
  console.log(`  Knowledge:   ${summary.knowledge}`);
  console.log('═'.repeat(50) + '\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });

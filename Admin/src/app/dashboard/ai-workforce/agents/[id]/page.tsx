"use client";

import React, { use, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot, ArrowLeft, Clock, CheckCircle, XCircle, DollarSign, Zap, Wrench, Shield, BarChart3, Brain, Settings, Activity, Plus, ChevronRight, Key, Cpu, FileText, Database, Eye,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

/* ── types ─────────────────────────────────────── */
type AgentDetail = {
  id: string;
  name: string;
  department?: string;
  model?: string;
  status?: string;
  autonomyLevel?: string;
  createdAt?: string;
  systemPrompt?: string;
  budgetLimit?: number;
};

type StatItem = {
  tasksCompleted?: number;
  tasksFailed?: number;
  totalTokens?: number;
  totalCost?: number;
  avgLatency?: number;
};

type Execution = {
  id: string;
  taskType?: string;
  status?: string;
  tokens?: number;
  cost?: number;
  latency?: number;
  startedAt?: string;
  completedAt?: string;
};

type Tool = {
  id: string;
  name: string;
  description?: string;
  status?: string;
};

type Permission = {
  id: string;
  resource?: string;
  action?: string;
  effect?: string;
};

type Task = {
  id: string;
  type?: string;
  status?: string;
  priority?: string;
  cost?: number;
  createdAt?: string;
  completedAt?: string;
};

type AuditEntry = {
  id: string;
  action?: string;
  timestamp?: string;
  status?: string;
  details?: string;
};

/* ── status dot ────────────────────────────────── */
function StatusDot({ status }: { status?: string }) {
  const color =
    status === 'active' || status === 'success' || status === 'completed'
      ? 'bg-emerald-400'
      : status === 'failed' || status === 'error' || status === 'critical'
        ? 'bg-red-400'
        : status === 'running' || status === 'pending'
          ? 'bg-amber-400'
          : 'bg-slate-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

function StatusBadge({ status }: { status?: string }) {
  const cls =
    status === 'active' || status === 'success' || status === 'completed'
      ? 'text-emerald-400 border-emerald-500/30'
      : status === 'failed' || status === 'error' || status === 'critical'
        ? 'text-rose-400 border-rose-500/30'
        : status === 'running' || status === 'pending'
          ? 'text-amber-400 border-amber-500/30'
          : 'text-slate-400 border-slate-600/30';
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-semibold ${cls}`}>
      {status || 'unknown'}
    </span>
  );
}

const TABS = ['Overview', 'Tools', 'Permissions', 'Tasks', 'Memory', 'KPIs', 'Audit', 'Settings'] as const;

type TabName = (typeof TABS)[number];

/* ── page ──────────────────────────────────────── */
export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [stats, setStats] = useState<StatItem | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabName>('Overview');
  const [loading, setLoading] = useState(true);
  const [newPerm, setNewPerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch(`/api/admin/ai-workforce/agents/${id}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setAgent(data.agent ?? null);
          setStats(data.stats ?? null);
          setExecutions(data.executions ?? []);
          setTools(data.tools ?? []);
          setPermissions(data.permissions ?? []);
          setTasks(data.tasks ?? []);
          setAuditLog(data.auditLog ?? []);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-16">
        <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Agent not found</p>
        <Link href="/dashboard/ai-workforce/agents" className="text-amber-400 text-sm mt-2 inline-block hover:underline">
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-400 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{agent.name}</h1>
                <StatusDot status={agent.status} />
                <StatusBadge status={agent.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold">
                  {agent.department || 'General'}
                </span>
                <span>{agent.model || '—'}</span>
                <span>Autonomy: <span className="text-amber-300 font-semibold uppercase">{agent.autonomyLevel || 'low'}</span></span>
                {agent.createdAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(agent.createdAt).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800 pb-px">
        {TABS.map((tab) => {
          const icons: Record<TabName, React.ComponentType<{ className?: string }>> = {
            Overview: Eye,
            Tools: Wrench,
            Permissions: Shield,
            Tasks: FileText,
            Memory: Brain,
            KPIs: BarChart3,
            Audit: Activity,
            Settings: Settings,
          };
          const Icon = icons[tab];
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                active
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {/* ─── Overview ─── */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tasks Completed</p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-400 tabular-nums">{stats?.tasksCompleted ?? 0}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tasks Failed</p>
                <p className="mt-1 text-2xl font-extrabold text-red-400 tabular-nums">{stats?.tasksFailed ?? 0}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Tokens</p>
                <p className="mt-1 text-2xl font-extrabold text-sky-400 tabular-nums">{(stats?.totalTokens ?? 0).toLocaleString()}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Cost</p>
                <p className="mt-1 text-2xl font-extrabold text-amber-400 tabular-nums">${(stats?.totalCost ?? 0).toFixed(2)}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Latency</p>
                <p className="mt-1 text-2xl font-extrabold text-violet-400 tabular-nums">{stats?.avgLatency ?? 0}ms</p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h3 className="text-sm font-bold text-white mb-4">Recent Executions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {executions.length === 0 ? (
                  <p className="text-slate-600 text-sm py-4 text-center">No executions yet</p>
                ) : (
                  executions.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 font-medium">{ex.taskType || 'Task'}</p>
                        <p className="text-[11px] text-slate-500">{ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '—'}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-500">{ex.tokens?.toLocaleString() ?? 0} tokens</span>
                        <span className="text-xs text-slate-400">${(ex.cost ?? 0).toFixed(4)}</span>
                        <span className="text-xs text-slate-500">{ex.latency ?? 0}ms</span>
                        <StatusBadge status={ex.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* ─── Tools ─── */}
        {activeTab === 'Tools' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Assigned Tools</h3>
              <button className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-3 py-1.5 hover:bg-amber-500/25 transition">
                <Plus className="w-3.5 h-3.5" /> Add Tool
              </button>
            </div>
            <div className="space-y-2">
              {tools.length === 0 ? (
                <p className="text-slate-600 text-sm py-8 text-center">No tools assigned</p>
              ) : (
                tools.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                    <div className="flex items-center gap-3 min-w-0">
                      <Wrench className="w-4 h-4 text-amber-400/60 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 font-medium">{t.name}</p>
                        <p className="text-xs text-slate-500 truncate">{t.description || 'No description'}</p>
                      </div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Permissions ─── */}
        {activeTab === 'Permissions' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Permissions</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="e.g. read:users:*"
                value={newPerm}
                onChange={(e) => setNewPerm(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/40 transition"
              />
              <button className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-4 py-2 hover:bg-amber-500/25 transition">
                <Plus className="w-3.5 h-3.5" /> Add Permission
              </button>
            </div>
            <div className="space-y-2">
              {permissions.length === 0 ? (
                <p className="text-slate-600 text-sm py-4 text-center">No permissions configured</p>
              ) : (
                permissions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                    <div className="flex items-center gap-3 min-w-0">
                      <Key className="w-4 h-4 text-amber-400/60 shrink-0" />
                      <code className="text-sm text-slate-200 font-mono">
                        {p.action}:{p.resource}
                        {p.resource?.includes('*') && <span className="text-amber-400 font-bold">*</span>}
                      </code>
                    </div>
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                      p.effect === 'allow' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'
                    }`}>
                      {p.effect || 'allow'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Tasks ─── */}
        {activeTab === 'Tasks' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Tasks</h3>
              <button className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-3 py-1.5 hover:bg-amber-500/25 transition">
                <Plus className="w-3.5 h-3.5" /> Create Task
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-slate-600 text-sm py-8 text-center">No tasks found</p>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 font-medium">{t.type || 'Task'}</p>
                      <p className="text-[11px] text-slate-500">{t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500">${(t.cost ?? 0).toFixed(4)}</span>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Memory ─── */}
        {activeTab === 'Memory' && (
          <div className="space-y-4">
            {(['Short-term Memory', 'Working Memory', 'Long-term Memory'] as const).map((label, idx) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">{label}</h3>
                </div>
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
                  <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Memory store not yet configured</p>
                  <p className="text-xs text-slate-600 mt-1">This section will display {label.toLowerCase()} entries</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ─── KPIs ─── */}
        {activeTab === 'KPIs' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              {[
                { label: 'Task Success Rate', value: stats?.tasksCompleted && ((stats.tasksCompleted + (stats.tasksFailed ?? 0)) > 0) ? ((stats.tasksCompleted / (stats.tasksCompleted + (stats.tasksFailed ?? 0))) * 100).toFixed(1) : '0', unit: '%', color: 'bg-emerald-400' },
                { label: 'Avg Cost per Task', value: stats?.tasksCompleted ? ((stats.totalCost ?? 0) / stats.tasksCompleted).toFixed(4) : '0', unit: '$', color: 'bg-amber-400' },
                { label: 'Avg Tokens per Task', value: stats?.tasksCompleted ? Math.round((stats.totalTokens ?? 0) / stats.tasksCompleted).toLocaleString() : '0', unit: '', color: 'bg-sky-400' },
                { label: 'Avg Latency', value: String(stats?.avgLatency ?? 0), unit: 'ms', color: 'bg-violet-400' },
              ].map((m) => {
                const pct = Math.min(100, parseFloat(m.value.replace(/[^0-9.]/g, '')));
                return (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">{m.label}</span>
                      <span className="text-slate-200 font-semibold tabular-nums">{m.unit === '$' ? `$${m.value}` : m.value}{m.unit !== '$' ? m.unit : ''}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                      <motion.div
                        className={`h-full rounded-full ${m.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct > 100 ? 100 : pct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── Audit ─── */}
        {activeTab === 'Audit' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Audit Log</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLog.length === 0 ? (
                <p className="text-slate-600 text-sm py-8 text-center">No audit entries</p>
              ) : (
                auditLog.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 font-medium">{entry.action || 'Action'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{entry.details || ''}</p>
                      <p className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
                      </p>
                    </div>
                    <StatusBadge status={entry.status} />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Settings ─── */}
        {activeTab === 'Settings' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">Agent Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Name</label>
                  <input
                    defaultValue={agent.name}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">System Prompt</label>
                  <textarea
                    defaultValue={agent.systemPrompt || ''}
                    rows={4}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400/40 transition resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Model</label>
                    <input
                      defaultValue={agent.model || ''}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400/40 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Autonomy Level</label>
                    <select
                      defaultValue={agent.autonomyLevel || 'low'}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 appearance-none focus:outline-none focus:border-amber-400/40 transition"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Budget Limit ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={agent.budgetLimit ?? 0}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400/40 transition"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                  <div>
                    <p className="text-sm text-slate-200 font-medium">Status</p>
                    <p className="text-xs text-slate-500">Enable or disable this agent</p>
                  </div>
                  <button className={`w-12 h-6 rounded-full transition-colors relative ${agent.status === 'active' ? 'bg-emerald-500/60' : 'bg-slate-700'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${agent.status === 'active' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button className="rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-6 py-2 hover:bg-amber-500/25 transition">
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

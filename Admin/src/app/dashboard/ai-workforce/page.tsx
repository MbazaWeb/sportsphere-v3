"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Bot, Brain, DollarSign, Shield, Activity, Zap, Plus, ChevronRight, Clock, CheckCircle, XCircle, AlertTriangle, Cpu, ListChecks, Send, Eye,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

/* ── types ─────────────────────────────────────── */
type CommandCenterStats = {
  totalAgents?: number;
  activeTasks?: number;
  pendingApprovals?: number;
  todayCost?: number;
};

type AuditEntry = {
  id: string;
  agentName?: string;
  action?: string;
  timestamp?: string;
  status?: string;
  details?: string;
};

type AgentCard = {
  id: string;
  name: string;
  department?: string;
  status?: string;
  model?: string;
  autonomyLevel?: string;
  tasksRunning?: number;
  budgetUsed?: number;
  budgetLimit?: number;
};

type Alert = {
  id: string;
  type?: string;
  message?: string;
  timestamp?: string;
  severity?: string;
};

/* ── animated counter ──────────────────────────── */
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
    const step = 16;
    const steps = Math.ceil(duration / step);
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplayed(end);
        clearInterval(timer);
      } else {
        setDisplayed(current);
      }
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <span className="tabular-nums">{displayed.toFixed(decimals)}</span>;
}

/* ── status dot ────────────────────────────────── */
function StatusDot({ status }: { status?: string }) {
  const color =
    status === 'active' || status === 'success'
      ? 'bg-emerald-400'
      : status === 'failed' || status === 'error' || status === 'critical'
        ? 'bg-red-400'
        : status === 'running' || status === 'pending' || status === 'warning'
          ? 'bg-amber-400'
          : 'bg-slate-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

/* ── status badge ──────────────────────────────── */
function StatusBadge({ status }: { status?: string }) {
  const cls =
    status === 'active' || status === 'success' || status === 'completed'
      ? 'text-emerald-400 border-emerald-500/30'
      : status === 'failed' || status === 'error' || status === 'critical'
        ? 'text-rose-400 border-rose-500/30'
        : status === 'running' || status === 'pending' || status === 'warning'
          ? 'text-amber-400 border-amber-500/30'
          : 'text-slate-400 border-slate-600/30';
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-semibold ${cls}`}>
      {status || 'unknown'}
    </span>
  );
}

/* ── main page ─────────────────────────────────── */
export default function AICommandCenterPage() {
  const [stats, setStats] = useState<CommandCenterStats | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/ai-workforce/command-center', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats ?? null);
          setAuditLog(data.auditLog ?? []);
          setAgents(data.activeAgents ?? []);
          setAlerts(data.alerts ?? []);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">AI Command Center</h1>
            <p className="text-sm text-slate-400 mt-1">Multi-Agent Operating System</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/dashboard/ai-workforce/settings">
          <motion.button
            whileHover={{ y: -1 }}
            className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-4 py-2 hover:bg-amber-500/25 transition"
          >
            <Plus className="w-4 h-4" /> New Agent
          </motion.button>
        </Link>
        <Link href="/dashboard/ai-workforce/tasks">
          <motion.button
            whileHover={{ y: -1 }}
            className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-4 py-2 hover:bg-amber-500/25 transition"
          >
            <Send className="w-4 h-4" /> Create Task
          </motion.button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Agents</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-amber-400">
                <AnimatedNumber value={stats?.totalAgents ?? 0} />
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-amber-400">
              <Bot className="h-4 w-4" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Tasks</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-sky-400">
                <AnimatedNumber value={stats?.activeTasks ?? 0} />
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-sky-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Approvals</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-amber-300">
                <AnimatedNumber value={stats?.pendingApprovals ?? 0} />
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-amber-300">
              <Shield className="h-4 w-4" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Today&apos;s Cost</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-400">
                $<AnimatedNumber value={stats?.todayCost ?? 0} decimals={2} />
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Stream */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" /> Activity Stream
            </h2>
            <Link href="/dashboard/audit" className="text-xs text-slate-500 hover:text-amber-400 flex items-center gap-1 transition">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLog.length === 0 ? (
              <p className="text-slate-600 text-sm py-8 text-center">No activity yet</p>
            ) : (
              auditLog.slice(0, 20).map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Bot className="w-4 h-4 text-amber-400/60 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">
                        <span className="font-semibold text-amber-300">{entry.agentName || 'Unknown'}</span>{' '}
                        <span className="text-slate-500">—</span> {entry.action || 'No action'}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={entry.status} />
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Right column: Alerts + Quick Nav */}
        <div className="space-y-6">
          {/* Unread Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Unread Alerts
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-slate-600 text-sm py-4 text-center">No alerts</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/40"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'warning' ? 'text-amber-400' : 'text-slate-400'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-200">{alert.message || 'No details'}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Nav */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <h2 className="text-sm font-bold text-white mb-4">Quick Navigation</h2>
            <div className="space-y-1">
              {[
                { href: '/dashboard/ai-workforce/agents', label: 'Agent Directory', icon: Bot },
                { href: '/dashboard/ai-workforce/chat', label: 'AI Chat', icon: Brain },
                { href: '/dashboard/ai-workforce/tasks', label: 'Task Management', icon: ListChecks },
                { href: '/dashboard/ai-workforce/approvals', label: 'Approval Queue', icon: CheckCircle },
                { href: '/dashboard/ai-workforce/costs', label: 'Cost Dashboard', icon: DollarSign },
                { href: '/dashboard/ai-workforce/settings', label: 'System Settings', icon: Zap },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-amber-400/10 hover:text-amber-400 transition"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  <ChevronRight className="w-3 h-3 ml-auto text-slate-600" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Active Agents Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" /> Active Agents
          </h2>
          <Link href="/dashboard/ai-workforce/agents" className="text-xs text-slate-500 hover:text-amber-400 flex items-center gap-1 transition">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.length === 0 ? (
            <p className="text-slate-600 text-sm col-span-full py-8 text-center">No active agents</p>
          ) : (
            agents.map((agent) => {
              const budgetPct = agent.budgetLimit ? Math.min(100, ((agent.budgetUsed ?? 0) / agent.budgetLimit) * 100) : 0;
              return (
                <Link key={agent.id} href={`/dashboard/ai-workforce/agents/${agent.id}`}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3 h-full cursor-pointer hover:border-amber-400/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusDot status={agent.status} />
                        <h3 className="text-sm font-bold text-white truncate">{agent.name}</h3>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        {agent.autonomyLevel || 'low'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="bg-slate-800 px-2 py-0.5 rounded-full">{agent.department || '—'}</span>
                      <span>{agent.model || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Tasks running</span>
                      <span className="text-sky-400 font-semibold">{agent.tasksRunning ?? 0}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Budget</span>
                        <span className="text-slate-400 tabular-nums">
                          ${(agent.budgetUsed ?? 0).toFixed(2)} / ${(agent.budgetLimit ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          className={`h-full rounded-full ${budgetPct > 80 ? 'bg-red-400' : budgetPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${budgetPct}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

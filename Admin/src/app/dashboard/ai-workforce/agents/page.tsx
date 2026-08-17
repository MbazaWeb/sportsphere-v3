"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Bot, Search, Filter, Plus, Clock, Wrench, ChevronRight,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

/* ── types ─────────────────────────────────────── */
type Agent = {
  id: string;
  name: string;
  department?: string;
  model?: string;
  status?: string;
  autonomyLevel?: string;
  kpis?: { completed?: number; failed?: number; avgLatency?: number };
  budgetUsed?: number;
  budgetLimit?: number;
  toolCount?: number;
  lastActivity?: string;
};

/* ── status helpers ────────────────────────────── */
function StatusDot({ status }: { status?: string }) {
  const color =
    status === 'active' || status === 'success'
      ? 'bg-emerald-400'
      : status === 'failed' || status === 'error'
        ? 'bg-red-400'
        : status === 'running' || status === 'pending'
          ? 'bg-amber-400'
          : 'bg-slate-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

/* ── page ──────────────────────────────────────── */
export default function AgentDirectoryPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/ai-workforce/agents', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list: Agent[] = data.agents ?? [];
          setAgents(list);
          const depts = [...new Set(list.map((a) => a.department).filter(Boolean) as string[])];
          setDepartments(depts);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = agents.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === 'all' || a.department === dept;
    return matchSearch && matchDept;
  });

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
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-7 h-7 text-amber-400" />
            <h1 className="text-3xl font-black text-white tracking-tight">Agent Directory</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Browse and manage all AI agents</p>
        </div>
        <Link href="/dashboard/ai-workforce/settings">
          <motion.button
            whileHover={{ y: -1 }}
            className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-4 py-2 hover:bg-amber-500/25 transition"
          >
            <Plus className="w-4 h-4" /> Create Agent
          </motion.button>
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/70 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/40 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/70 pl-10 pr-8 py-2.5 text-sm text-slate-200 appearance-none focus:outline-none focus:border-amber-400/40 transition cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agent Grid */}
      {filtered.length === 0 ? (
        <p className="text-slate-600 text-sm py-12 text-center">No agents found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((agent) => {
            const budgetPct = agent.budgetLimit ? Math.min(100, ((agent.budgetUsed ?? 0) / agent.budgetLimit) * 100) : 0;
            return (
              <Link key={agent.id} href={`/dashboard/ai-workforce/agents/${agent.id}`}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3 h-full cursor-pointer hover:border-amber-400/20 transition-colors"
                >
                  {/* Name + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot status={agent.status} />
                      <h3 className="text-sm font-bold text-white truncate">{agent.name}</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                  </div>

                  {/* Department badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold">
                      {agent.department || 'General'}
                    </span>
                    <span className="text-xs text-slate-500">{agent.model || '—'}</span>
                  </div>

                  {/* Autonomy */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Autonomy:</span>
                    <span className={`font-semibold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                      agent.autonomyLevel === 'high'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : agent.autonomyLevel === 'medium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {agent.autonomyLevel || 'low'}
                    </span>
                  </div>

                  {/* KPI summary */}
                  {agent.kpis && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-sm font-bold text-emerald-400">{agent.kpis.completed ?? 0}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Done</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-400">{agent.kpis.failed ?? 0}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Failed</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-sky-400">{agent.kpis.avgLatency ?? 0}ms</p>
                        <p className="text-[10px] text-slate-500 uppercase">Avg Lat</p>
                      </div>
                    </div>
                  )}

                  {/* Budget bar */}
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

                  {/* Tool count + last activity */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> {agent.toolCount ?? 0} tools
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {agent.lastActivity ? new Date(agent.lastActivity).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

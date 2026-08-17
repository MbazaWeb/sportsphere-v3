"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Clock, DollarSign, Plus, ChevronDown, ChevronUp, Bot,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

/* -- types ------------------------------------------------- */
type Task = {
  id: string;
  type?: string;
  status?: string;
  priority?: string;
  agentName?: string;
  createdAt?: string;
  completedAt?: string;
  cost?: number;
  duration?: number;
  result?: string;
  error?: string;
};

const STATUS_FILTERS = ['all', 'running', 'completed', 'failed', 'waiting_approval'] as const;

function StatusBadge({ status }: { status?: string }) {
  const cls =
    status === 'completed' || status === 'success'
      ? 'text-emerald-400 border-emerald-500/30'
      : status === 'failed' || status === 'error'
        ? 'text-rose-400 border-rose-500/30'
        : status === 'running'
          ? 'text-amber-400 border-amber-500/30'
          : status === 'waiting_approval'
            ? 'text-sky-400 border-sky-500/30'
            : 'text-slate-400 border-slate-600/30';
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-semibold ${cls}`}>
      {status?.replace('_', ' ') || 'unknown'}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  const cls =
    priority === 'critical' || priority === 'high'
      ? 'text-red-400 bg-red-500/10 border-red-500/20'
      : priority === 'medium'
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        : 'text-slate-400 bg-slate-500/10 border-slate-600/20';
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-semibold ${cls}`}>
      {priority || 'normal'}
    </span>
  );
}

/* -- page -------------------------------------------------- */
export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/ai-workforce/tasks', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks ?? []);
          const unique = [...new Map((data.agents ?? []).map((a: { id: string; name: string }) => [a.id, a])).values()];
          setAgents(unique);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = tasks.filter((t) => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchAgent = agentFilter === 'all' || t.agentName === agentFilter;
    return matchStatus && matchAgent;
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
            <FileText className="w-7 h-7 text-amber-400" />
            <h1 className="text-3xl font-black text-white tracking-tight">Task Management</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Monitor and manage all AI agent tasks</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-4 py-2 hover:bg-amber-500/25 transition">
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                statusFilter === s
                  ? 'bg-amber-400/15 text-amber-400 border border-amber-400/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 appearance-none focus:outline-none focus:border-amber-400/40 transition cursor-pointer pr-8"
          >
            <option value="all">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <p className="text-slate-600 text-sm py-12 text-center">No tasks found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const expanded = expandedId === task.id;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : task.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-800/30 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-amber-400/60 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 font-medium truncate">{task.type || 'Task'}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> {task.agentName || '—'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.createdAt ? new Date(task.createdAt).toLocaleString() : '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    <span className="text-xs text-slate-500 tabular-nums">${(task.cost ?? 0).toFixed(4)}</span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-slate-800/60 p-4 bg-slate-900/40 space-y-3"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500 uppercase font-semibold">Status</p>
                        <p className="text-slate-200 mt-0.5">{task.status?.replace('_', ' ') || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-semibold">Priority</p>
                        <p className="text-slate-200 mt-0.5">{task.priority || 'normal'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-semibold">Cost</p>
                        <p className="text-slate-200 mt-0.5 tabular-nums">${(task.cost ?? 0).toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-semibold">Duration</p>
                        <p className="text-slate-200 mt-0.5">{task.duration ? `${(task.duration / 1000).toFixed(1)}s` : '—'}</p>
                      </div>
                    </div>
                    {task.result && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Result</p>
                        <p className="text-sm text-slate-300 bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">{task.result}</p>
                      </div>
                    )}
                    {task.error && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Error</p>
                        <p className="text-sm text-red-300 bg-red-500/5 rounded-xl p-3 border border-red-500/20">{task.error}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

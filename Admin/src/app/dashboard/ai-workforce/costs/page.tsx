"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Calendar, TrendingUp, BarChart3,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

/* -- types ------------------------------------------------- */
type CostOverview = {
  todayCost?: number;
  monthCost?: number;
  monthBudget?: number;
};

type AgentCost = {
  agentId?: string;
  agentName?: string;
  costUsed?: number;
  budgetLimit?: number;
};

type DeptCost = {
  department?: string;
  cost?: number;
};

type DailyCost = {
  date?: string;
  cost?: number;
};

/* -- page -------------------------------------------------- */
export default function CostDashboardPage() {
  const [overview, setOverview] = useState<CostOverview | null>(null);
  const [agentCosts, setAgentCosts] = useState<AgentCost[]>([]);
  const [deptCosts, setDeptCosts] = useState<DeptCost[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/ai-workforce/costs', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setOverview(data.overview ?? null);
          setAgentCosts(data.agentCosts ?? []);
          setDeptCosts(data.deptCosts ?? []);
          setDailyCosts(data.dailyCosts ?? []);
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

  const maxDeptCost = Math.max(1, ...deptCosts.map((d) => d.cost ?? 0));
  const maxDailyCost = Math.max(1, ...dailyCosts.map((d) => d.cost ?? 0));
  const monthPct = overview?.monthBudget ? Math.min(100, ((overview.monthCost ?? 0) / overview.monthBudget) * 100) : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-amber-400" />
          <h1 className="text-3xl font-black text-white tracking-tight">AI Cost Dashboard</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">Track spending across agents, departments, and time</p>
      </div>

      {/* Top cost cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Today&apos;s Cost</p>
              <p className="mt-1 text-3xl font-extrabold text-amber-400 tabular-nums">${(overview?.todayCost ?? 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-amber-400">
              <Calendar className="h-4 w-4" />
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">This Month</p>
              <p className="mt-1 text-3xl font-extrabold text-sky-400 tabular-nums">${(overview?.monthCost ?? 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-sky-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Budget</span>
              <span className="text-slate-400 tabular-nums">${(overview?.monthCost ?? 0).toFixed(2)} / ${(overview?.monthBudget ?? 0).toFixed(2)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className={`h-full rounded-full ${monthPct > 80 ? 'bg-red-400' : monthPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                initial={{ width: 0 }}
                animate={{ width: `${monthPct}%` }}
                transition={{ duration: 0.8 }}
              />
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">7-Day Average</p>
              <p className="mt-1 text-3xl font-extrabold text-emerald-400 tabular-nums">
                ${dailyCosts.length > 0 ? (dailyCosts.reduce((s, d) => s + (d.cost ?? 0), 0) / Math.max(1, dailyCosts.length)).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-emerald-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Budget per agent */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
      >
        <h2 className="text-sm font-bold text-white mb-4">Budget Utilization per Agent</h2>
        <div className="space-y-3">
          {agentCosts.length === 0 ? (
            <p className="text-slate-600 text-sm py-4 text-center">No agent cost data</p>
          ) : (
            agentCosts.map((ac) => {
              const pct = ac.budgetLimit ? Math.min(100, ((ac.costUsed ?? 0) / ac.budgetLimit) * 100) : 0;
              return (
                <div key={ac.agentId}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium truncate max-w-[200px]">{ac.agentName || '—'}</span>
                    <span className="text-slate-400 tabular-nums">
                      ${(ac.costUsed ?? 0).toFixed(2)} / ${(ac.budgetLimit ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      className={`h-full rounded-full ${pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by department */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <h2 className="text-sm font-bold text-white mb-4">Cost by Department</h2>
          {deptCosts.length === 0 ? (
            <p className="text-slate-600 text-sm py-4 text-center">No department data</p>
          ) : (
            <div className="space-y-3">
              {deptCosts.map((d, i) => {
                const widthPct = ((d.cost ?? 0) / maxDeptCost) * 100;
                const colors = ['bg-amber-400', 'bg-sky-400', 'bg-emerald-400', 'bg-violet-400', 'bg-rose-400', 'bg-cyan-400', 'bg-orange-400'];
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300">{d.department || '—'}</span>
                      <span className="text-slate-400 tabular-nums">${(d.cost ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                      <motion.div
                        className={`h-full rounded-full ${colors[i % colors.length]}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Cost trend last 7 days */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <h2 className="text-sm font-bold text-white mb-4">Cost Trend (Last 7 Days)</h2>
          {dailyCosts.length === 0 ? (
            <p className="text-slate-600 text-sm py-4 text-center">No daily data</p>
          ) : (
            <div className="flex items-end gap-2 h-48">
              {dailyCosts.map((d, i) => {
                const heightPct = ((d.cost ?? 0) / maxDailyCost) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 tabular-nums">${(d.cost ?? 0).toFixed(2)}</span>
                    <motion.div
                      className="w-full rounded-t-lg bg-gradient-to-t from-amber-500/60 to-amber-400 min-h-[4px]"
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      style={{ maxHeight: '100%' }}
                    />
                    <span className="text-[10px] text-slate-500">
                      {d.date ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3) : `D${i + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

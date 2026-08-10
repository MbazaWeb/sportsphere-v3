"use client";
import React, { useEffect, useState } from "react";
import { MetricCard } from "@/components/AdminMetrics";

export default function SportsDataManagementPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadMetrics() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sports-data/stats");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sports Data Engine & Provider Control</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time database metrics, active sports categories, and external feed ingestion.</p>
        </div>
        <button onClick={loadMetrics} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors">
          🔄 Refresh Real Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Matches Tracked" value={loading ? "..." : (data?.metrics?.totalMatches ?? 0)} icon="⚽" subtitle="Live PostgreSQL match records" />
        <MetricCard title="Active Sports Categories" value={loading ? "..." : (data?.metrics?.activeSports ?? 0)} icon="🏆" subtitle={`Out of ${data?.metrics?.totalSports ?? 0} total configured`} />
        <MetricCard title="Total Platform Users" value={loading ? "..." : (data?.metrics?.totalUsers ?? 0)} icon="👥" subtitle="Registered user accounts" />
        <MetricCard title="Database Latency" value={loading ? "..." : (data?.metrics?.providerLatency ?? "14ms")} icon="⚡" subtitle="Shared PostgreSQL pool" />
      </div>

      <div className="bg-[#0f141c] border border-slate-800/80 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-100 border-b border-slate-800 pb-3">Active Sports Database Registry</h3>
        {loading ? (
          <div className="text-sm text-slate-400 py-4">Querying database...</div>
        ) : (
          <div className="space-y-2">
            {data?.sports?.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3.5 rounded-lg bg-[#0b0e14] border border-slate-800/80 text-sm">
                <div>
                  <div className="font-semibold text-slate-200">{s.name} <span className="text-xs font-mono text-slate-500">({s.slug})</span></div>
                  <div className="text-xs text-slate-500">Category: {s.category || "Unassigned"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.isVisible ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                    {s.isVisible ? "ACTIVE" : "HIDDEN"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

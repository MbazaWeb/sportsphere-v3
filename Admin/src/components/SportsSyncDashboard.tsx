"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Database, Calendar, Activity, CheckCircle2, AlertCircle, Play, Layers, Clock } from "lucide-react";

interface Stats {
  totalMatches: number;
  upcomingMatches: number;
  liveMatches: number;
  completedMatches: number;
}

interface LeagueStat {
  name: string;
  count: number;
}

interface SyncRunResult {
  provider: string;
  sport: string;
  matchesCreated: number;
  matchesUpdated: number;
  errors: string[];
}

export default function SportsSyncDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leagues, setLeagues] = useState<LeagueStat[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncRunResult[] | null>(null);

  const [selectedProviders, setSelectedProviders] = useState<string[]>(["thesportsdb", "openligadb", "ergast"]);
  const [selectedSports, setSelectedSports] = useState<string[]>(["football", "f1", "motorsport"]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sports-sync");
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setLeagues(data.leagues);
        setRecentMatches(data.recentMatches);
      }
    } catch (err) {
      console.error("Failed to load sync stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      setLastSyncResult(null);

      const res = await fetch("/api/sports-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providers: selectedProviders, sports: selectedSports }),
      });

      const data = await res.json();
      if (data.results) {
        setLastSyncResult(data.results);
      }

      await fetchDashboardData();
    } catch (err) {
      console.error("Sync trigger error:", err);
    } finally {
      setSyncing(false);
    }
  };

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-900 text-slate-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-400" />
            Sports Data Sync & Engine Control
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor real-time match records and orchestrate multi-provider sync operations.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading || syncing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Stats
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Total DB Matches</span>
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">
            {stats ? stats.totalMatches.toLocaleString() : "---"}
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Upcoming Fixtures</span>
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-3">
            {stats ? stats.upcomingMatches.toLocaleString() : "---"}
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Live Matches</span>
            <Activity className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-3">
            {stats ? stats.liveMatches.toLocaleString() : "---"}
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Active Leagues</span>
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{leagues.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-400" />
            Trigger Data Sync
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Select Active Providers
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: "thesportsdb", name: "TheSportsDB (Free / Global)" },
                  { id: "openligadb", name: "OpenLigaDB (German Leagues)" },
                  { id: "ergast", name: "Ergast (F1 Motorsport)" },
                ].map((p) => {
                  const active = selectedProviders.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProvider(p.id)}
                      className={`px-4 py-2.5 rounded-lg text-xs font-medium border transition flex items-center gap-2 ${
                        active ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${active ? "bg-indigo-400" : "bg-slate-600"}`} />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleTriggerSync}
                disabled={syncing || selectedProviders.length === 0}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing External Providers..." : "Run Sync Now"}
              </button>
            </div>
          </div>

          {lastSyncResult && (
            <div className="mt-6 pt-5 border-t border-slate-700/60 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Latest Execution Summary
              </h3>
              <div className="space-y-2">
                {lastSyncResult.map((res, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900/80 border border-slate-700/40 rounded-lg text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-indigo-300 capitalize">{res.provider}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 capitalize">{res.sport}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-emerald-400 font-medium">+{res.matchesCreated} created</span>
                      <span className="text-blue-400 font-medium">{res.matchesUpdated} updated</span>
                      {res.errors.length > 0 ? (
                        <span className="text-rose-400 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {res.errors.length} errors
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Success
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Ingested Competitions</h2>
          <div className="space-y-3">
            {leagues.length === 0 ? (
              <p className="text-xs text-slate-500">No match records found in database.</p>
            ) : (
              leagues.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-slate-700/40 last:border-0">
                  <span className="text-slate-300 truncate max-w-[200px]" title={item.name}>
                    {item.name}
                  </span>
                  <span className="font-mono font-semibold bg-slate-700/50 text-indigo-300 px-2 py-0.5 rounded">
                    {item.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Recently Ingested Matches
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">League</th>
                <th className="p-3">Fixture</th>
                <th className="p-3">Status</th>
                <th className="p-3">Kickoff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {recentMatches.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-medium text-slate-200">{m.league}</td>
                  <td className="p-3">
                    {m.homeTeam} <span className="text-slate-500">vs</span> {m.awayTeam}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        m.status === "upcoming"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : m.status === "live"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                          : "bg-slate-700/40 text-slate-400"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-400">
                    {new Date(m.kickoffAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

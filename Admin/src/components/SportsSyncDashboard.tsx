"use client";

import React, { useState, useEffect, useCallback } from "react";
import ApiProviderManager from "./ApiProviderManager";
import {
  RefreshCw,
  Database,
  Activity,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  Users,
  Shield,
  Trophy,
  UserCircle,
} from "lucide-react";

interface Stats {
  totalMatches: number;
  upcomingMatches: number;
  liveMatches: number;
  completedMatches: number;
  leagues: number;
  teams: number;
  players: number;
  coaches: number;
  activeSports: number;
  matchProfiles: number;
}

interface SyncRunResult {
  provider: string;
  sport: string;
  leaguesCreated: number;
  leaguesUpdated: number;
  teamsCreated: number;
  teamsUpdated: number;
  playersCreated: number;
  playersUpdated: number;
  coachesCreated?: number;
  coachesUpdated?: number;
  matchesCreated: number;
  matchesUpdated: number;
  errors: string[];
}

const PROVIDERS = [
  { id: "thesportsdb", label: "TheSportsDB", sports: "Football & multi" },
  { id: "openligadb", label: "OpenLigaDB", sports: "German football" },
  { id: "football-data-org", label: "football-data.org", sports: "EU football + coaches" },
  { id: "rapid-live-football", label: "RapidAPI Live Football", sports: "Leagues, matches, player/team search" },
  { id: "sportmonks", label: "Sportmonks", sports: "Paid: full coverage · Free: DK+Scotland" },
  { id: "ergast", label: "Ergast F1", sports: "Formula 1" },
];

const SPORTS = [
  { id: "football", label: "Football" },
  { id: "f1", label: "F1" },
  { id: "motorsport", label: "Motorsport" },
  { id: "basketball", label: "Basketball" },
];

export default function SportsSyncDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leagues, setLeagues] = useState<{ name: string; count: number }[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [recentLeagues, setRecentLeagues] = useState<any[]>([]);
  const [recentTeams, setRecentTeams] = useState<any[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<any[]>([]);
  const [recentCoaches, setRecentCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncRunResult[] | null>(null);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);

  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    "thesportsdb",
    "openligadb",
    "football-data-org",
    "ergast",
  ]);
  const [selectedSports, setSelectedSports] = useState<string[]>(["football", "f1", "motorsport"]);
  const [customProviders, setCustomProviders] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const h = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string; name: string }[];
      setCustomProviders(detail || []);
    };
    window.addEventListener("sportsphere-custom-providers", h);
    return () => window.removeEventListener("sportsphere-custom-providers", h);
  }, []);

  const applyInventory = (data: any) => {
    if (data.stats) setStats(data.stats);
    if (data.leagues) setLeagues(data.leagues);
    if (data.recentMatches) setRecentMatches(data.recentMatches);
    if (data.recentLeagues) setRecentLeagues(data.recentLeagues);
    if (data.recentTeams) setRecentTeams(data.recentTeams);
    if (data.recentPlayers) setRecentPlayers(data.recentPlayers);
    if (data.recentCoaches) setRecentCoaches(data.recentCoaches);
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/sports-sync", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to load (${res.status})`);
        return;
      }
      applyInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error loading inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTriggerSync = async () => {
    if (selectedProviders.length === 0 || selectedSports.length === 0) {
      setError("Select at least one provider and one sport");
      return;
    }
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 130_000);
    try {
      setSyncing(true);
      setError(null);
      setLastSyncResult(null);
      setSummary(null);

      const res = await fetch("/api/sports-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providers: selectedProviders,
          sports: selectedSports,
        }),
        signal: controller.signal,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        setError(`Sync returned non-JSON response (HTTP ${res.status})`);
        return;
      }

      if (data.results) setLastSyncResult(data.results);
      if (data.summary) setSummary(data.summary);
      if (data.inventory) applyInventory(data.inventory);
      else if (res.ok) await fetchDashboardData();

      if (data.status === "failed" || (data.ok === false && !data.partial)) {
        const detail =
          data.error ||
          data.code ||
          (data.meta?.failedRuns
            ? `${data.meta.failedRuns} provider/sport run(s) failed`
            : `Sync failed (HTTP ${res.status})`);
        setError(String(detail));
        return;
      }

      if (data.status === "partial" || data.partial) {
        const n = data.meta?.totalErrors ?? data.summary?.errors ?? 0;
        setError(
          `Partial sync: ${n} issue(s). See per-provider results below — some data may still have been written.`
        );
        return;
      }

      if (data.status === "skipped") {
        setError(
          "All selected runs were skipped (e.g. missing API tokens). Enable a configured provider or set tokens in Admin .env."
        );
        return;
      }

      if (!res.ok && res.status !== 207) {
        setError(data.error || `Sync failed (HTTP ${res.status})`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Sync timed out after 130s. Try fewer providers/sports and retry.");
      } else if (err instanceof TypeError) {
        setError("Network error — check connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Sync network error");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setSyncing(false);
    }
  };

  const toggle = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    id: string
  ) => {
    setList((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const kpi = [
    { label: "Leagues", value: stats?.leagues ?? 0, icon: Trophy, color: "text-amber-400" },
    { label: "Teams", value: stats?.teams ?? 0, icon: Shield, color: "text-sky-400" },
    { label: "Players", value: stats?.players ?? 0, icon: Users, color: "text-emerald-400" },
    { label: "Coaches", value: stats?.coaches ?? 0, icon: UserCircle, color: "text-violet-400" },
    { label: "Matches", value: stats?.totalMatches ?? 0, icon: Activity, color: "text-rose-400" },
    { label: "Live", value: stats?.liveMatches ?? 0, icon: Layers, color: "text-orange-400" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-slate-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-400" />
            Sports Sync — Leagues · Teams · Players · Coaches
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Multi-provider sync into structured entities. Errors are captured per provider/sport.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading || syncing}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm hover:bg-slate-700 disabled:opacity-40 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleTriggerSync}
            disabled={syncing || loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold disabled:opacity-40 flex items-center gap-2"
          >
            <Play className={`w-4 h-4 ${syncing ? "animate-pulse" : ""}`} />
            {syncing ? "Syncing…" : "Run sync"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Sync notice</div>
            <div className="text-rose-300/90 break-words mt-0.5">{error}</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs px-2 py-1 rounded-lg border border-rose-500/30 hover:bg-rose-500/20"
            >
              Dismiss
            </button>
            <button
              type="button"
              disabled={syncing}
              onClick={() => void handleTriggerSync()}
              className="text-xs px-2 py-1 rounded-lg border border-rose-500/30 hover:bg-rose-500/20 disabled:opacity-40"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Entity KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpi.map((k) => (
          <div
            key={k.label}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider">
              <span>{k.label}</span>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <div className={`text-2xl font-bold mt-2 ${k.color}`}>
              {loading && !stats ? "…" : k.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Provider + sport selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
          <h2 className="font-semibold text-slate-200">Providers</h2>
          <div className="flex flex-wrap gap-2">
            {[...PROVIDERS, ...customProviders.map((cp) => ({ id: cp.id, label: cp.name, sports: "Custom HTTP API" }))].map((p) => (
              <button
                key={p.id}
                onClick={() => toggle(selectedProviders, setSelectedProviders, p.id)}
                className={`px-3 py-2 rounded-xl text-xs border transition ${
                  selectedProviders.includes(p.id)
                    ? "bg-indigo-500/20 border-indigo-400/50 text-indigo-200"
                    : "bg-slate-800/50 border-slate-700 text-slate-400"
                }`}
              >
                <div className="font-semibold">{p.label}</div>
                <div className="opacity-70">{p.sports}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
          <h2 className="font-semibold text-slate-200">Sports</h2>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => toggle(selectedSports, setSelectedSports, s.id)}
                className={`px-3 py-2 rounded-xl text-xs border transition ${
                  selectedSports.includes(s.id)
                    ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
                    : "bg-slate-800/50 border-slate-700 text-slate-400"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ApiProviderManager
        onProvidersChanged={(customs) => {
          // merge custom ids into selection availability via state event
          window.dispatchEvent(new CustomEvent("sportsphere-custom-providers", { detail: customs }));
        }}
      />

      {/* Last sync summary */}
      {(summary || lastSyncResult) && (
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Last sync result
          </h2>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {[
                ["Leagues +", summary.leaguesCreated],
                ["Leagues ~", summary.leaguesUpdated],
                ["Teams +", summary.teamsCreated],
                ["Teams ~", summary.teamsUpdated],
                ["Players +", summary.playersCreated],
                ["Players ~", summary.playersUpdated],
                ["Matches +", summary.matchesCreated],
                ["Matches ~", summary.matchesUpdated],
              ].map(([label, val]) => (
                <div key={String(label)} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="text-slate-500">{label}</div>
                  <div className="text-lg font-bold text-slate-100">{val ?? 0}</div>
                </div>
              ))}
            </div>
          )}
          {lastSyncResult && (
            <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
              {lastSyncResult.map((r, i) => (
                <div
                  key={`${r.provider}-${r.sport}-${i}`}
                  className="p-3 rounded-xl border border-slate-800 flex flex-col gap-1"
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-200">
                      {r.provider} / {r.sport}
                    </span>
                    <span
                      className={
                        r.errors.length
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }
                    >
                      {r.errors.length
                        ? `${r.errors.length} issue(s)`
                        : "ok"}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    L {r.leaguesCreated}/{r.leaguesUpdated} · T {r.teamsCreated}/
                    {r.teamsUpdated} · P {r.playersCreated}/{r.playersUpdated} · M{" "}
                    {r.matchesCreated}/{r.matchesUpdated}
                  </div>
                  {r.errors.slice(0, 8).map((e, j) => (
                    <div key={j} className="text-rose-400/90 truncate">
                      {e}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Entity lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EntityList title="Leagues (recent)" empty="No leagues synced yet — run sync" rows={recentLeagues.map((l) => ({
          id: l.id,
          primary: l.name,
          secondary: [l.country, l.source].filter(Boolean).join(" · "),
        }))} />
        <EntityList title="Teams (recent)" empty="No teams synced yet" rows={recentTeams.map((t) => ({
          id: t.id,
          primary: t.name,
          secondary: [t.country, t.source].filter(Boolean).join(" · "),
        }))} />
        <EntityList title="Players (recent)" empty="No players synced yet" rows={recentPlayers.map((p) => ({
          id: p.id,
          primary: p.name,
          secondary: [p.position, p.nationality, p.source].filter(Boolean).join(" · "),
        }))} />
        <EntityList title="Coaches (recent)" empty="No coaches yet (providers rarely expose coaches)" rows={recentCoaches.map((c) => ({
          id: c.id,
          primary: c.name,
          secondary: [c.role, c.nationality, c.source].filter(Boolean).join(" · "),
        }))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
          <h2 className="font-semibold text-slate-200 mb-3">Top leagues by matches</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
            {leagues.length === 0 && (
              <p className="text-slate-600 text-xs">No match league breakdown yet</p>
            )}
            {leagues.map((l) => (
              <div key={l.name} className="flex justify-between border-b border-slate-800/80 py-1.5">
                <span className="text-slate-300 truncate pr-2">{l.name}</span>
                <span className="text-slate-500 tabular-nums">{l.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
          <h2 className="font-semibold text-slate-200 mb-3">Recent matches</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
            {recentMatches.length === 0 && (
              <p className="text-slate-600 text-xs">No matches</p>
            )}
            {recentMatches.map((m) => (
              <div key={m.id} className="border-b border-slate-800/80 py-1.5">
                <div className="text-slate-200">
                  {m.homeTeam} vs {m.awayTeam}
                  {m.homeScore != null && (
                    <span className="text-slate-500 ml-2">
                      {m.homeScore}-{m.awayScore}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {m.league} · {m.status} ·{" "}
                  {m.kickoffAt ? new Date(m.kickoffAt).toLocaleString() : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EntityList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { id: string; primary: string; secondary: string }[];
}) {
  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
      <h2 className="font-semibold text-slate-200 mb-3">{title}</h2>
      <div className="space-y-2 max-h-56 overflow-y-auto text-sm">
        {rows.length === 0 && <p className="text-slate-600 text-xs">{empty}</p>}
        {rows.map((r) => (
          <div key={r.id} className="border-b border-slate-800/80 py-1.5">
            <div className="text-slate-200">{r.primary}</div>
            {r.secondary && (
              <div className="text-xs text-slate-500">{r.secondary}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

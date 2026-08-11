"use client";
import React, { useEffect, useState, useCallback } from "react";
import { MetricCard } from "@/components/AdminMetrics";

interface IngestResult {
  format: string;
  url: string;
  recordsParsed: number;
  recordsIngested: number;
  matchesCreated: number;
  teamsCreated: number;
  playersCreated: number;
  errors: string[];
  elapsedMs: number;
  ingestionId: string;
}

interface IngestLog {
  id: string;
  action: string;
  newValue: any;
  createdAt: string;
}

export default function SportsDataManagementPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Ingestion state
  const [feedUrl, setFeedUrl] = useState("");
  const [feedFormat, setFeedFormat] = useState<"auto" | "json" | "csv">("auto");
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [ingestLogs, setIngestLogs] = useState<IngestLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  async function loadMetrics() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sports-data/stats");
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  const loadIngestLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ingest?limit=20");
      if (res.ok) {
        const json = await res.json();
        setIngestLogs(json.entries || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadMetrics(); loadIngestLogs(); }, [loadIngestLogs]);

  const handleIngest = async () => {
    if (!feedUrl.trim()) return;
    setIngesting(true);
    setIngestResult(null);
    try {
      const res = await fetch("/api/admin/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: feedUrl.trim(), format: feedFormat }),
      });
      const json = await res.json();
      if (!res.ok) {
        setIngestResult({
          format: feedFormat, url: feedUrl, recordsParsed: 0, recordsIngested: 0,
          matchesCreated: 0, teamsCreated: 0, playersCreated: 0,
          errors: [json.error || "Ingestion failed"], elapsedMs: 0, ingestionId: "",
        });
      } else {
        setIngestResult(json);
      }
      loadMetrics();
      loadIngestLogs();
    } catch (err) {
      setIngestResult({
        format: feedFormat, url: feedUrl, recordsParsed: 0, recordsIngested: 0,
        matchesCreated: 0, teamsCreated: 0, playersCreated: 0,
        errors: ["Network error. Check the URL and try again."], elapsedMs: 0, ingestionId: "",
      });
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sports Data Engine & Provider Control</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time database metrics, active sports categories, and external feed ingestion.</p>
        </div>
        <button onClick={loadMetrics} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors">
          🔄 Refresh Real Data
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Matches Tracked" value={loading ? "..." : (data?.metrics?.totalMatches ?? 0)} icon="⚽" subtitle="Live PostgreSQL match records" />
        <MetricCard title="Active Sports Categories" value={loading ? "..." : (data?.metrics?.activeSports ?? 0)} icon="🏆" subtitle={`Out of ${data?.metrics?.totalSports ?? 0} total configured`} />
        <MetricCard title="Total Platform Users" value={loading ? "..." : (data?.metrics?.totalUsers ?? 0)} icon="👥" subtitle="Registered user accounts" />
        <MetricCard title="Database Latency" value={loading ? "..." : (data?.metrics?.providerLatency ?? "14ms")} icon="⚡" subtitle="Shared PostgreSQL pool" />
      </div>

      {/* ─── External Feed Ingestion ─────────────────── */}
      <div className="bg-[#0f141c] border border-slate-800/80 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              🔗 External Feed Ingestion
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Paste any sports data URL (JSON/CSV) to extract and import records into the database.
            </p>
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
          >
            {showLogs ? "📝 Back to Ingest" : "📜 Ingestion Logs"}
          </button>
        </div>

        {showLogs ? (
          /* ── Ingestion Logs View ── */
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Recent Ingestion History</h4>
            {ingestLogs.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No ingestion records yet. Paste a URL above to start.</p>
            ) : (
              ingestLogs.map((log) => {
                const v = log.newValue || {};
                const isError = log.action === "ingest.error";
                const isComplete = log.action === "ingest.complete";
                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-lg border text-sm ${
                      isError
                        ? "bg-red-500/5 border-red-500/20"
                        : isComplete
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-slate-900 border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isError ? "bg-red-500/20 text-red-300" : isComplete ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {log.action.replace("ingest.", "")}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-600">
                        {(v.elapsedMs || 0).toLocaleString()}ms
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-1" title={v.url}>
                      {v.url || "—"}
                    </div>
                    {isComplete && (
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-slate-400">Format: <span className="text-slate-200 font-mono">{v.format || "?"}</span></span>
                        <span className="text-slate-400">Parsed: <span className="text-slate-200 font-bold">{v.recordsParsed || 0}</span></span>
                        <span className="text-emerald-400">Ingested: <span className="font-bold">{v.recordsIngested || 0}</span></span>
                        <span className="text-blue-400">Matches: <span className="font-bold">+{v.matchesCreated || 0}</span></span>
                      </div>
                    )}
                    {isError && v.error && (
                      <div className="mt-2 text-xs text-red-300">{v.error}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ── URL Input View ── */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Data Source URL
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://api.example.com/v2/matches?date=2026-08-11"
                  className="flex-1 rounded-lg bg-[#0b0e14] border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/60 font-mono"
                  onKeyDown={(e) => { if (e.key === "Enter" && !ingesting) handleIngest(); }}
                />
                <select
                  value={feedFormat}
                  onChange={(e) => setFeedFormat(e.target.value as any)}
                  className="rounded-lg bg-[#0b0e14] border border-slate-700 px-3 py-3 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
                <button
                  onClick={handleIngest}
                  disabled={ingesting || !feedUrl.trim()}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-lg transition disabled:opacity-40 disabled:cursor-not-nowrap flex items-center gap-2 shrink-0"
                >
                  {ingesting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Ingesting…
                    </>
                  ) : (
                    "⚡ Ingest Data"
                  )}
                </button>
              </div>
            </div>

            {/* Supported formats hint */}
            <div className="rounded-lg bg-slate-900/60 border border-slate-800/60 p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Supported Data Formats</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-500">
                <div>
                  <span className="text-amber-400 font-semibold">JSON</span> — Arrays of match/team/player objects.
                  Keys: <code className="text-slate-400">homeTeam, awayTeam, homeScore, awayScore, league, kickoffAt, status</code>
                </div>
                <div>
                  <span className="text-amber-400 font-semibold">CSV</span> — Header row + data rows.
                  Columns: <code className="text-slate-400">home_team, away_team, home_score, away_score, league, date, status</code>
                </div>
              </div>
            </div>

            {/* Result display */}
            {ingestResult && (
              <div className={`rounded-lg border p-4 ${ingestResult.errors.length > 0 && ingestResult.recordsIngested === 0 ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-200">
                    {ingestResult.recordsIngested > 0 ? "✅ Ingestion Complete" : "❌ Ingestion Failed"}
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">{ingestResult.elapsedMs}ms</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                  <div className="rounded bg-[#0b0e14] p-2">
                    <div className="text-lg font-bold text-slate-100">{ingestResult.recordsParsed}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Parsed</div>
                  </div>
                  <div className="rounded bg-[#0b0e14] p-2">
                    <div className="text-lg font-bold text-emerald-400">{ingestResult.recordsIngested}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Ingested</div>
                  </div>
                  <div className="rounded bg-[#0b0e14] p-2">
                    <div className="text-lg font-bold text-blue-400">+{ingestResult.matchesCreated}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Matches</div>
                  </div>
                  <div className="rounded bg-[#0b0e14] p-2">
                    <div className="text-lg font-bold text-amber-400">+{ingestResult.teamsCreated}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Teams</div>
                  </div>
                  <div className="rounded bg-[#0b0e14] p-2">
                    <div className="text-lg font-bold text-violet-400">+{ingestResult.playersCreated}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Players</div>
                  </div>
                </div>
                {ingestResult.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/60">
                    <div className="text-[10px] font-semibold uppercase text-red-400 mb-1">
                      Errors ({ingestResult.errors.length})
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {ingestResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-300/80 font-mono">• {err}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Active Sports Database Registry ─────────── */}
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
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.isVisible ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                  {s.isVisible ? "ACTIVE" : "HIDDEN"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

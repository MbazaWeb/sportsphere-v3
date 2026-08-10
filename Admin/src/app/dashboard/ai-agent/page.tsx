'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface AIJob {
  id: string;
  jobType: string;
  status: string;
  triggeredBy: string;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  logMessage: string | null;
  errorDetails: any;
  startedAt: string;
  completedAt: string | null;
}

interface AIJobResult {
  jobId: string;
  type: string;
  itemsCreated: number;
  itemsUpdated: number;
  errors: string[];
  log: string[];
}

interface ActionCardConfig {
  key: string;
  emoji: string;
  title: string;
  description: string;
  endpoint: string;
  body: Record<string, any>;
  color: string;
}

const ACTION_CARDS: ActionCardConfig[] = [
  {
    key: 'sync',
    emoji: '🔄',
    title: 'Sync Sports Data',
    description: 'Pull fresh teams, players, leagues, and matches from TheSportsDB, OpenLigaDB, and Ergast F1.',
    endpoint: '/api/admin/ai/sync',
    body: {},
    color: 'border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10',
  },
  {
    key: 'generate_news',
    emoji: '📰',
    title: 'Generate News',
    description: 'Auto-generate draft match reports from recent finished fixtures.',
    endpoint: '/api/admin/ai/generate',
    body: { type: 'generate_news' },
    color: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10',
  },
  {
    key: 'generate_rumors',
    emoji: '💬',
    title: 'Generate Rumors',
    description: 'Auto-generate plausible transfer rumors with credibility scores for recently synced players.',
    endpoint: '/api/admin/ai/generate',
    body: { type: 'generate_rumors' },
    color: 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10',
  },
  {
    key: 'verify_profiles',
    emoji: '✅',
    title: 'Verify Profiles',
    description: 'Soft-verify player profiles from trusted sources (TheSportsDB, OpenLigaDB). Sets verified=true with verificationLevel=soft.',
    endpoint: '/api/admin/ai/generate',
    body: { type: 'verify_profiles' },
    color: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10',
  },
  {
    key: 'tag_images',
    emoji: '🏷️',
    title: 'Tag Image Ownership',
    description: 'Attribute untagged news images to their source team/player for proper credit.',
    endpoint: '/api/admin/ai/generate',
    body: { type: 'tag_images' },
    color: 'border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10',
  },
];

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function duration(startIso: string, endIso: string | null): string {
  if (!endIso) return 'running…';
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (diff < 1000) return `${diff}ms`;
  if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
  return `${(diff / 60000).toFixed(1)}m`;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string; pulse?: boolean }> = {
    running: { label: 'RUNNING', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30', pulse: true },
    success: { label: 'SUCCESS', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    failed: { label: 'FAILED', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
    partial: { label: 'PARTIAL', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  };
  const cfg = map[status] || { label: status, color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
      {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {cfg.label}
    </span>
  );
}

function jobTypeLabel(t: string) {
  const map: Record<string, string> = {
    sync_sports: '🔄 Sync Sports',
    generate_news: '📰 Gen News',
    generate_rumors: '💬 Gen Rumors',
    tag_images: '🏷️ Tag Images',
    verify_profiles: '✅ Verify Profiles',
  };
  return map[t] || t;
}

export default function AIAgentPage() {
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [resultModal, setResultModal] = useState<{ title: string; result: AIJobResult | any; isSync?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    aiActivity?: {
      jobsToday: number;
      jobsLast7Days: number;
      newsAI: number;
      rumorsAI: number;
      profilesAI: number;
      claimsPending: number;
    };
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsRes, statsRes] = await Promise.all([
        fetch('/api/admin/ai/jobs?limit=50', { cache: 'no-store' }),
        fetch('/api/admin/stats', { cache: 'no-store' }),
      ]);
      const jobsJson = await jobsRes.json();
      const statsJson = await statsRes.json();
      setJobs(jobsJson.data || []);
      if (!statsRes.ok) {
        setError(statsJson?.error || null);
      } else {
        setStats(statsJson);
      }
    } catch (err) {
      console.error('Load error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(card: ActionCardConfig) {
    setRunning(card.key);
    setError(null);
    try {
      const res = await fetch(card.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card.body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `${card.title} failed`);
      } else {
        if (card.key === 'sync') {
          setResultModal({
            title: `${card.emoji} ${card.title} Results`,
            result: json,
            isSync: true,
          });
        } else {
          setResultModal({
            title: `${card.emoji} ${card.title} Results`,
            result: json as AIJobResult,
          });
        }
      }
      await load();
    } catch (err) {
      console.error('Run error:', err);
      setError('Network error');
    } finally {
      setRunning(null);
    }
  }

  const aiActivity = stats?.aiActivity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">🤖 AI Agent</h1>
        <p className="text-sm text-slate-400 mt-1">
          Run AI jobs to sync data, generate content, verify profiles, and tag image ownership.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          ⚠ {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/dashboard/news?createdByAI=true"
          className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 hover:bg-amber-500/10 transition-colors"
        >
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">AI News (draft)</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{aiActivity?.newsAI ?? '—'}</div>
          <div className="text-[10px] text-slate-500 mt-1">→ Manage</div>
        </Link>
        <Link
          href="/dashboard/rumors?createdByAI=true"
          className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 hover:bg-purple-500/10 transition-colors"
        >
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">AI Rumors (draft)</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{aiActivity?.rumorsAI ?? '—'}</div>
          <div className="text-[10px] text-slate-500 mt-1">→ Manage</div>
        </Link>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">AI Profiles</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{aiActivity?.profilesAI ?? '—'}</div>
          <div className="text-[10px] text-slate-500 mt-1">Players auto-created</div>
        </div>
        <Link
          href="/dashboard/claims?status=pending"
          className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 hover:bg-red-500/10 transition-colors"
        >
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wider">Pending Claims</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{aiActivity?.claimsPending ?? '—'}</div>
          <div className="text-[10px] text-slate-500 mt-1">→ Review</div>
        </Link>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACTION_CARDS.map((card) => (
          <button
            key={card.key}
            onClick={() => runAction(card)}
            disabled={running !== null}
            className={`text-left rounded-xl border p-5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${card.color}`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{card.emoji}</span>
              {running === card.key && (
                <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <h3 className="text-base font-bold text-white mb-1">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>
            <div className="mt-4 text-xs text-amber-400 font-semibold">
              {running === card.key ? 'Running…' : '▶ Run job'}
            </div>
          </button>
        ))}
      </div>

      {/* Recent AI Jobs */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Recent AI Jobs</h3>
          <button
            onClick={load}
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            ↻ Refresh
          </button>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading jobs…</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No AI jobs yet. Run an action above to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#0b0e14] text-slate-500 uppercase tracking-wider">
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 font-semibold">Job Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Triggered By</th>
                  <th className="text-left px-4 py-3 font-semibold">Created / Updated</th>
                  <th className="text-left px-4 py-3 font-semibold">Started</th>
                  <th className="text-left px-4 py-3 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <React.Fragment key={j.id}>
                    <tr
                      onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                      className="border-b border-slate-800/40 hover:bg-slate-800/20 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {jobTypeLabel(j.jobType)}
                      </td>
                      <td className="px-4 py-3">{statusBadge(j.status)}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono">{j.triggeredBy}</td>
                      <td className="px-4 py-3 text-slate-300 tabular-nums">
                        <span className="text-emerald-300">+{j.itemsCreated}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-sky-300">↻{j.itemsUpdated}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{timeAgo(j.startedAt)}</td>
                      <td className="px-4 py-3 text-slate-400 tabular-nums">{duration(j.startedAt, j.completedAt)}</td>
                    </tr>
                    {expanded === j.id && (
                      <tr className="bg-[#0b0e14]">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="space-y-3">
                            {j.logMessage && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Log Message</div>
                                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-[#0f141c] p-3 rounded border border-slate-800 max-h-48 overflow-y-auto">
                                  {j.logMessage}
                                </pre>
                              </div>
                            )}
                            {j.errorDetails && Object.keys(j.errorDetails).length > 0 && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Error Details</div>
                                <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono bg-[#0f141c] p-3 rounded border border-red-500/20 max-h-48 overflow-y-auto">
                                  {JSON.stringify(j.errorDetails, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-[10px] text-slate-500">
                              <span>Job ID: <span className="font-mono text-slate-400">{j.id}</span></span>
                              <span>Started: <span className="font-mono text-slate-400">{new Date(j.startedAt).toISOString()}</span></span>
                              {j.completedAt && (
                                <span>Completed: <span className="font-mono text-slate-400">{new Date(j.completedAt).toISOString()}</span></span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{resultModal.title}</h2>
              <button
                onClick={() => setResultModal(null)}
                className="text-slate-500 hover:text-slate-300 text-xl leading-none"
              >
                ×
              </button>
            </div>
            {resultModal.isSync ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-300">
                  Synced <span className="font-bold text-amber-300">{resultModal.result.results?.length || 0}</span> provider/sport combinations.
                </div>
                {resultModal.result.results?.map((r: any, i: number) => {
                  const created = (r.leaguesCreated || 0) + (r.teamsCreated || 0) + (r.playersCreated || 0) + (r.matchesCreated || 0);
                  const updated = (r.leaguesUpdated || 0) + (r.teamsUpdated || 0) + (r.playersUpdated || 0) + (r.matchesUpdated || 0);
                  return (
                    <div key={i} className="bg-[#0b0e14] rounded-lg p-3 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-mono text-amber-300">{r.provider}</span>
                          <span className="text-slate-500"> / </span>
                          <span className="text-slate-300">{r.sport}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-300">+{created} created</span>
                          <span className="text-sky-300">↻{updated} updated</span>
                        </div>
                      </div>
                      {r.errors?.length > 0 && (
                        <div className="text-red-300 mt-2">
                          <div className="font-semibold mb-1">Errors ({r.errors.length}):</div>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                            {r.errors.slice(0, 5).map((e: string, ei: number) => (
                              <li key={ei} className="font-mono">{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0b0e14] border border-slate-800 rounded-lg p-4">
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Items Created</div>
                    <div className="text-2xl font-bold text-emerald-300 tabular-nums">{resultModal.result.itemsCreated ?? 0}</div>
                  </div>
                  <div className="bg-[#0b0e14] border border-slate-800 rounded-lg p-4">
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Items Updated</div>
                    <div className="text-2xl font-bold text-sky-300 tabular-nums">{resultModal.result.itemsUpdated ?? 0}</div>
                  </div>
                </div>
                {resultModal.result.errors?.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-red-400 mb-2">
                      Errors ({resultModal.result.errors.length})
                    </div>
                    <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono bg-[#0b0e14] p-3 rounded border border-red-500/20 max-h-40 overflow-y-auto">
                      {resultModal.result.errors.join('\n')}
                    </pre>
                  </div>
                )}
                {resultModal.result.log?.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Log</div>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-[#0b0e14] p-3 rounded border border-slate-800 max-h-40 overflow-y-auto">
                      {resultModal.result.log.join('\n')}
                    </pre>
                  </div>
                )}
                <div className="text-xs text-slate-500">
                  Job ID: <span className="font-mono text-slate-400">{resultModal.result.jobId}</span>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setResultModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={load}
                className="flex-1 px-4 py-2 rounded-lg bg-amber-400 text-slate-900 hover:bg-amber-300 text-sm font-bold"
              >
                Refresh Jobs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

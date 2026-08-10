'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  module: string;
  targetType: string | null;
  targetId: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

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

function actionColor(action: string): string {
  if (action.includes('delete') || action.includes('reject') || action.includes('ban')) return 'text-red-300';
  if (action.includes('create') || action.includes('approve') || action.includes('verify')) return 'text-emerald-300';
  if (action.includes('update') || action.includes('reorder') || action.includes('toggle')) return 'text-sky-300';
  if (action.includes('login') || action.includes('logout')) return 'text-amber-300';
  return 'text-slate-300';
}

function moduleColor(module: string): string {
  const map: Record<string, string> = {
    users: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
    sports: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    verifications: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    posts: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
    roles: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    moderation: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
  };
  return map[module] || 'bg-slate-500/15 border-slate-500/30 text-slate-300';
}

export default function AuditPage() {
  const [data, setData] = useState<{
    entries: AuditEntry[];
    total: number;
    modules: string[];
  }>({ entries: [], total: 0, modules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      if (moduleFilter !== 'ALL') params.set('module', moduleFilter);
      if (actionFilter) params.set('action', actionFilter);
      const res = await fetch(`/api/admin/audit?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to load audit log.');
        setData({ entries: [], total: 0, modules: [] });
      } else {
        setData(json);
      }
    } catch (err) {
      console.error('Audit log load error:', err);
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, actionFilter, offset]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">📜 Audit Log</h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete record of admin actions across all modules. Every create, update,
          delete, approve, and reject is logged with actor, target, before/after values,
          and IP address for compliance and accountability.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={moduleFilter}
          onChange={(e) => {
            setModuleFilter(e.target.value);
            setOffset(0);
          }}
          className="rounded-lg bg-[#0f141c] border border-slate-700 px-4 py-2.5 text-sm text-slate-100"
        >
          <option value="ALL">All Modules</option>
          {data.modules.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by action (e.g. sport.create, user.ban)…"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setOffset(0);
          }}
          className="flex-1 rounded-lg bg-[#0f141c] border border-slate-700 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          ⚠ {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#141b26] border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">When</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">Module</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">Action</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">Target</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">Actor</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">IP</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/60">
                  <td className="px-4 py-3"><div className="skeleton h-5 w-16" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-20" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-28" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-24" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-20" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-24" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-12" /></td>
                </tr>
              ))
            ) : data.entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No audit entries match your filters.
                </td>
              </tr>
            ) : (
              data.entries.map((e) => (
                <React.Fragment key={e.id}>
                  <tr
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                  >
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{timeAgo(e.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${moduleColor(e.module)}`}>
                        {e.module}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs font-mono ${actionColor(e.action)}`}>{e.action}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {e.targetType ? `${e.targetType}:${(e.targetId || '').slice(0, 8)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{(e.actorId || '').slice(0, 8) || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{e.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {expandedId === e.id ? '▲' : '▼'}
                    </td>
                  </tr>
                  {expandedId === e.id && (
                    <tr className="bg-[#0b0e14]">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Full Timestamp
                            </div>
                            <div className="text-slate-300">{new Date(e.createdAt).toISOString()}</div>
                            {e.userAgent && (
                              <>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-3 mb-1">
                                  User Agent
                                </div>
                                <div className="text-slate-400 break-all">{e.userAgent}</div>
                              </>
                            )}
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Old Value
                            </div>
                            <pre className="text-slate-400 bg-[#0f141c] rounded p-2 overflow-x-auto text-[10px]">
                              {JSON.stringify(e.oldValue, null, 2) || '{}'}
                            </pre>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-3 mb-1">
                              New Value
                            </div>
                            <pre className="text-slate-300 bg-[#0f141c] rounded p-2 overflow-x-auto text-[10px]">
                              {JSON.stringify(e.newValue, null, 2) || '{}'}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && data.total > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {offset + 1}–{Math.min(offset + limit, data.total)} of {data.total.toLocaleString()} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1.5 rounded border border-slate-700 text-slate-300 disabled:opacity-30 hover:border-slate-500"
            >
              ← Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= data.total}
              className="px-3 py-1.5 rounded border border-slate-700 text-slate-300 disabled:opacity-30 hover:border-slate-500"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

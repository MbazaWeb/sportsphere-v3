'use client';

import React, { useCallback, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────
interface BaseEntity {
  id: string;
  name: string;
  slug: string;
  source?: string | null;
  verified: boolean;
  createdByAI: boolean;
  claimedById?: string | null;
  claimedBy?: { id: string; name: string; handle: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Team extends BaseEntity {
  country?: string | null;
  city?: string | null;
  venue?: string | null;
  logoUrl?: string | null;
  foundedYear?: number | null;
  league?: { id: string; name: string } | null;
  sport?: { id: string; name: string; icon: string } | null;
}

interface Player extends BaseEntity {
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  nationality?: string | null;
  photoUrl?: string | null;
  shirtNumber?: number | null;
  team?: { id: string; name: string; logoUrl?: string | null } | null;
  sport?: { id: string; name: string; icon: string } | null;
}

interface Coach extends BaseEntity {
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  nationality?: string | null;
  photoUrl?: string | null;
  team?: { id: string; name: string; logoUrl?: string | null } | null;
  sport?: { id: string; name: string; icon: string } | null;
}

interface League extends BaseEntity {
  country?: string | null;
  countryCode?: string | null;
  type?: string | null;
  season?: string | null;
  logoUrl?: string | null;
  sport?: { id: string; name: string; icon: string } | null;
}

interface Match {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute?: number | null;
  kickoffAt: string;
  venue?: string | null;
  source?: string | null;
  league?: { id: string; name: string } | null;
  sport?: { id: string; name: string; icon: string } | null;
  homeTeam?: { id: string; name: string; logoUrl?: string | null } | null;
  awayTeam?: { id: string; name: string; logoUrl?: string | null } | null;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface SyncResult {
  provider: string;
  sport: string;
  leaguesCreated: number;
  leaguesUpdated: number;
  teamsCreated: number;
  teamsUpdated: number;
  playersCreated: number;
  playersUpdated: number;
  matchesCreated: number;
  matchesUpdated: number;
  errors: string[];
}

const TABS = ['Teams', 'Players', 'Coaches', 'Leagues', 'Matches'] as const;
type Tab = (typeof TABS)[number];

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  thesportsdb: { label: 'TheSportsDB', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  openligadb: { label: 'OpenLigaDB', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  ergast: { label: 'Ergast F1', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  manual: { label: 'Manual', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  ai: { label: 'AI', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
};

function SourceBadge({ source }: { source?: string | null }) {
  if (!source) return <span className="text-xs text-slate-600">—</span>;
  const cfg = SOURCE_LABELS[source] || { label: source, color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-sky-500/15 text-sky-300 border-sky-500/30">
        <span>✓</span> Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-red-500/15 text-red-300 border-red-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Not Verified
    </span>
  );
}

function AIBadge({ createdByAI }: { createdByAI: boolean }) {
  if (!createdByAI) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/15 text-amber-300 border-amber-500/30">
      🤖 AI
    </span>
  );
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

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    live: { label: 'LIVE', color: 'bg-red-500/15 text-red-300 border-red-500/30 animate-pulse' },
    finished: { label: 'FT', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
    upcoming: { label: 'Upcoming', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    postponed: { label: 'PPD', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    cancelled: { label: 'CANC', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
  };
  const cfg = map[status] || { label: status, color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────
function EditModal({
  open,
  title,
  fields,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  fields: Array<{ key: string; label: string; type?: 'text' | 'number' | 'checkbox' | 'textarea'; value: any }>;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void;
}) {
  const [local, setLocal] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init: Record<string, any> = {};
    for (const f of fields) init[f.key] = f.value;
    setLocal(init);
  }, [fields]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
        </div>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {f.label}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                  rows={4}
                  value={local[f.key] ?? ''}
                  onChange={(e) => setLocal((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              ) : f.type === 'checkbox' ? (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-amber-400"
                    checked={!!local[f.key]}
                    onChange={(e) => setLocal((p) => ({ ...p, [f.key]: e.target.checked }))}
                  />
                  <span className="text-sm text-slate-300">{local[f.key] ? 'Yes' : 'No'}</span>
                </label>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                  value={local[f.key] ?? ''}
                  onChange={(e) =>
                    setLocal((p) => ({
                      ...p,
                      [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              await onSave(local);
              setSaving(false);
            }}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-amber-400 text-slate-900 hover:bg-amber-300 text-sm font-bold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  open,
  itemName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-2">Confirm Delete</h2>
        <p className="text-sm text-slate-400 mb-6">
          Are you sure you want to delete <span className="text-amber-300 font-semibold">{itemName}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-400 text-sm font-bold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function SportsDataPage() {
  const [tab, setTab] = useState<Tab>('Teams');
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'thesportsdb' | 'openligadb' | 'ergast' | 'manual'>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set('search', search);
      if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);

      let endpoint = '';
      if (tab === 'Teams') endpoint = '/api/admin/teams';
      else if (tab === 'Players') endpoint = '/api/admin/players';
      else if (tab === 'Coaches') endpoint = '/api/admin/coaches';
      else if (tab === 'Leagues') endpoint = '/api/admin/leagues';
      else if (tab === 'Matches') endpoint = '/api/admin/matches';

      const res = await fetch(`${endpoint}?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to load');
        setData([]);
        setTotal(0);
      } else {
        setData(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error('Load error:', err);
      setError('Network error');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, search, verifiedFilter, sourceFilter, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, verifiedFilter, sourceFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function syncAll() {
    setSyncing(true);
    setSyncError(null);
    setSyncResults(null);
    try {
      const res = await fetch('/api/admin/ai/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        setSyncError(json?.error || 'Sync failed');
      } else {
        setSyncResults(json.results || []);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setSyncError('Network error');
    } finally {
      setSyncing(false);
    }
  }

  async function patchEntity(endpoint: string, id: string, data: Record<string, any>) {
    const res = await fetch(`${endpoint}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || 'Update failed');
    }
    return res.json();
  }

  async function deleteEntity(endpoint: string, id: string) {
    const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || 'Delete failed');
    }
  }

  function getEndpoint() {
    if (tab === 'Teams') return '/api/admin/teams';
    if (tab === 'Players') return '/api/admin/players';
    if (tab === 'Coaches') return '/api/admin/coaches';
    if (tab === 'Leagues') return '/api/admin/leagues';
    return '/api/admin/matches';
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">⚽ Sports Data Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage teams, players, coaches, leagues, and matches synced from external providers.
          </p>
        </div>
        <button
          onClick={syncAll}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 text-slate-900 hover:bg-amber-300 text-sm font-bold disabled:opacity-50"
        >
          {syncing ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              Syncing…
            </>
          ) : (
            <>🔄 Sync from External APIs</>
          )}
        </button>
      </div>

      {/* Sync Results */}
      {(syncResults || syncError) && (
        <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              {syncError ? '⚠ Sync Error' : '✓ Sync Results'}
            </h3>
            <button
              onClick={() => {
                setSyncResults(null);
                setSyncError(null);
              }}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              dismiss
            </button>
          </div>
          {syncError ? (
            <div className="text-sm text-red-300">{syncError}</div>
          ) : (
            <div className="space-y-2">
              {syncResults!.map((r, i) => {
                const created =
                  r.leaguesCreated + r.teamsCreated + r.playersCreated + r.matchesCreated;
                const updated =
                  r.leaguesUpdated + r.teamsUpdated + r.playersUpdated + r.matchesUpdated;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs bg-[#0b0e14] rounded-lg p-3 border border-slate-800"
                  >
                    <div>
                      <span className="font-mono text-amber-300">{r.provider}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-slate-300">{r.sport}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                      <span className="text-emerald-300">+{created} created</span>
                      <span className="text-sky-300">↻{updated} updated</span>
                      {r.errors.length > 0 && (
                        <span className="text-red-300">⚠ {r.errors.length} errors</span>
                      )}
                    </div>
                  </div>
                );
              })}
              <button
                onClick={load}
                className="text-xs text-amber-400 hover:text-amber-300 mt-2"
              >
                ↻ Refresh table to see new entries
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder={`Search ${tab.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-[#0f141c] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-400/50 focus:outline-none"
        />
        {tab !== 'Matches' && (
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value as any)}
            className="bg-[#0f141c] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
          >
            <option value="all">All verification</option>
            <option value="verified">Verified only</option>
            <option value="unverified">Unverified only</option>
          </select>
        )}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as any)}
          className="bg-[#0f141c] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
        >
          <option value="all">All sources</option>
          <option value="thesportsdb">TheSportsDB</option>
          <option value="openligadb">OpenLigaDB</option>
          <option value="ergast">Ergast F1</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading {tab.toLowerCase()}…</div>
        ) : error ? (
          <div className="p-12 text-center text-red-300 text-sm">⚠ {error}</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No {tab.toLowerCase()} found. Try syncing from external APIs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#0b0e14] text-slate-500 uppercase tracking-wider">
                {tab === 'Teams' && (
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Country</th>
                    <th className="text-left px-4 py-3 font-semibold">League</th>
                    <th className="text-left px-4 py-3 font-semibold">Source</th>
                    <th className="text-left px-4 py-3 font-semibold">Verified</th>
                    <th className="text-left px-4 py-3 font-semibold">AI</th>
                    <th className="text-left px-4 py-3 font-semibold">Claimed</th>
                    <th className="text-right px-4 py-3 font-semibold">Actions</th>
                  </tr>
                )}
                {tab === 'Players' && (
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Team</th>
                    <th className="text-left px-4 py-3 font-semibold">Position</th>
                    <th className="text-left px-4 py-3 font-semibold">Nationality</th>
                    <th className="text-left px-4 py-3 font-semibold">Source</th>
                    <th className="text-left px-4 py-3 font-semibold">Verified</th>
                    <th className="text-left px-4 py-3 font-semibold">AI</th>
                    <th className="text-right px-4 py-3 font-semibold">Actions</th>
                  </tr>
                )}
                {tab === 'Coaches' && (
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Team</th>
                    <th className="text-left px-4 py-3 font-semibold">Role</th>
                    <th className="text-left px-4 py-3 font-semibold">Nationality</th>
                    <th className="text-left px-4 py-3 font-semibold">Source</th>
                    <th className="text-left px-4 py-3 font-semibold">Verified</th>
                    <th className="text-left px-4 py-3 font-semibold">AI</th>
                    <th className="text-right px-4 py-3 font-semibold">Actions</th>
                  </tr>
                )}
                {tab === 'Leagues' && (
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Country</th>
                    <th className="text-left px-4 py-3 font-semibold">Sport</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Source</th>
                    <th className="text-left px-4 py-3 font-semibold">Verified</th>
                    <th className="text-right px-4 py-3 font-semibold">Actions</th>
                  </tr>
                )}
                {tab === 'Matches' && (
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 font-semibold">Home</th>
                    <th className="text-left px-4 py-3 font-semibold">Away</th>
                    <th className="text-left px-4 py-3 font-semibold">Score</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">League</th>
                    <th className="text-left px-4 py-3 font-semibold">Kickoff</th>
                    <th className="text-left px-4 py-3 font-semibold">Source</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                    {tab === 'Teams' && (
                      <>
                        <td className="px-4 py-3 text-slate-200 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-slate-400">{item.country || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{item.league?.name || '—'}</td>
                        <td className="px-4 py-3"><SourceBadge source={item.source} /></td>
                        <td className="px-4 py-3"><VerifiedBadge verified={item.verified} /></td>
                        <td className="px-4 py-3"><AIBadge createdByAI={item.createdByAI} /></td>
                        <td className="px-4 py-3 text-slate-400">
                          {item.claimedBy ? (
                            <span className="text-xs">@{item.claimedBy.handle}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setEditing(item)}
                            className="text-xs text-amber-400 hover:text-amber-300 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleting(item)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                    {tab === 'Players' && (
                      <>
                        <td className="px-4 py-3 text-slate-200 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-slate-400">{item.team?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{item.position || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{item.nationality || '—'}</td>
                        <td className="px-4 py-3"><SourceBadge source={item.source} /></td>
                        <td className="px-4 py-3"><VerifiedBadge verified={item.verified} /></td>
                        <td className="px-4 py-3"><AIBadge createdByAI={item.createdByAI} /></td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setEditing(item)}
                            className="text-xs text-amber-400 hover:text-amber-300 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleting(item)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                    {tab === 'Coaches' && (
                      <>
                        <td className="px-4 py-3 text-slate-200 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-slate-400">{item.team?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{item.role || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{item.nationality || '—'}</td>
                        <td className="px-4 py-3"><SourceBadge source={item.source} /></td>
                        <td className="px-4 py-3"><VerifiedBadge verified={item.verified} /></td>
                        <td className="px-4 py-3"><AIBadge createdByAI={item.createdByAI} /></td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setEditing(item)}
                            className="text-xs text-amber-400 hover:text-amber-300 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleting(item)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                    {tab === 'Leagues' && (
                      <>
                        <td className="px-4 py-3 text-slate-200 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-slate-400">{item.country || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {item.sport?.icon} {item.sport?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{item.type || '—'}</td>
                        <td className="px-4 py-3"><SourceBadge source={item.source} /></td>
                        <td className="px-4 py-3"><VerifiedBadge verified={item.verified} /></td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setEditing(item)}
                            className="text-xs text-amber-400 hover:text-amber-300 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleting(item)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                    {tab === 'Matches' && (
                      <>
                        <td className="px-4 py-3 text-slate-200 font-medium">{item.homeTeamName}</td>
                        <td className="px-4 py-3 text-slate-200 font-medium">{item.awayTeamName}</td>
                        <td className="px-4 py-3 text-slate-300 tabular-nums">
                          {item.homeScore ?? '?'} - {item.awayScore ?? '?'}
                        </td>
                        <td className="px-4 py-3">{statusBadge(item.status)}</td>
                        <td className="px-4 py-3 text-slate-400">{item.league?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {formatKickoff(item.kickoffAt)}
                        </td>
                        <td className="px-4 py-3"><SourceBadge source={item.source} /></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
            <div>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                ← Prev
              </button>
              <span className="px-2 tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <EditModal
          open={!!editing}
          title={`Edit ${tab.slice(0, -1)}: ${editing.name}`}
          fields={getEditFields(tab, editing)}
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            try {
              await patchEntity(getEndpoint(), editing.id, data);
              setEditing(null);
              await load();
            } catch (err: any) {
              alert(err.message || 'Update failed');
            }
          }}
        />
      )}

      {/* Delete Modal */}
      {deleting && (
        <DeleteConfirmModal
          open={!!deleting}
          itemName={deleting.name || `${deleting.homeTeamName} vs ${deleting.awayTeamName}`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await deleteEntity(getEndpoint(), deleting.id);
              setDeleting(null);
              await load();
            } catch (err: any) {
              alert(err.message || 'Delete failed');
            }
          }}
        />
      )}
    </div>
  );
}

function getEditFields(tab: Tab, item: any) {
  if (tab === 'Teams') {
    return [
      { key: 'name', label: 'Name', value: item.name || '' },
      { key: 'country', label: 'Country', value: item.country || '' },
      { key: 'venue', label: 'Venue', value: item.venue || '' },
      { key: 'city', label: 'City', value: item.city || '' },
      { key: 'foundedYear', label: 'Founded Year', type: 'number' as const, value: item.foundedYear || '' },
      { key: 'logoUrl', label: 'Logo URL', value: item.logoUrl || '' },
      { key: 'verified', label: 'Verified', type: 'checkbox' as const, value: item.verified || false },
      { key: 'createdByAI', label: 'Created by AI', type: 'checkbox' as const, value: item.createdByAI || false },
    ];
  }
  if (tab === 'Players') {
    return [
      { key: 'name', label: 'Name', value: item.name || '' },
      { key: 'position', label: 'Position', value: item.position || '' },
      { key: 'nationality', label: 'Nationality', value: item.nationality || '' },
      { key: 'shirtNumber', label: 'Shirt Number', type: 'number' as const, value: item.shirtNumber || '' },
      { key: 'photoUrl', label: 'Photo URL', value: item.photoUrl || '' },
      { key: 'verified', label: 'Verified', type: 'checkbox' as const, value: item.verified || false },
      { key: 'createdByAI', label: 'Created by AI', type: 'checkbox' as const, value: item.createdByAI || false },
    ];
  }
  if (tab === 'Coaches') {
    return [
      { key: 'name', label: 'Name', value: item.name || '' },
      { key: 'role', label: 'Role', value: item.role || '' },
      { key: 'nationality', label: 'Nationality', value: item.nationality || '' },
      { key: 'photoUrl', label: 'Photo URL', value: item.photoUrl || '' },
      { key: 'verified', label: 'Verified', type: 'checkbox' as const, value: item.verified || false },
      { key: 'createdByAI', label: 'Created by AI', type: 'checkbox' as const, value: item.createdByAI || false },
    ];
  }
  if (tab === 'Leagues') {
    return [
      { key: 'name', label: 'Name', value: item.name || '' },
      { key: 'country', label: 'Country', value: item.country || '' },
      { key: 'type', label: 'Type', value: item.type || 'league' },
      { key: 'season', label: 'Season', value: item.season || '' },
      { key: 'logoUrl', label: 'Logo URL', value: item.logoUrl || '' },
      { key: 'verified', label: 'Verified', type: 'checkbox' as const, value: item.verified || false },
      { key: 'createdByAI', label: 'Created by AI', type: 'checkbox' as const, value: item.createdByAI || false },
    ];
  }
  return [];
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface ClaimUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatarUrl?: string | null;
}

interface ClaimRequest {
  id: string;
  userId: string;
  profileType: string;
  profileId: string;
  profileName: string;
  claimEmail?: string | null;
  claimPhone?: string | null;
  evidenceNotes?: string | null;
  evidenceUrls: any;
  status: string;
  reviewerId?: string | null;
  reviewNotes?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  user: ClaimUser | null;
  reviewer?: ClaimUser | null;
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

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'PENDING', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
    approved: { label: 'APPROVED', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    rejected: { label: 'REJECTED', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
    needs_info: { label: 'NEEDS INFO', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  };
  const cfg = map[status] || { label: status, color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function profileTypeBadge(t: string) {
  const map: Record<string, string> = {
    player: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    coach: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    team: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    league: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };
  const color = map[t] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
      {t}
    </span>
  );
}

function parseEvidenceUrls(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter((u) => typeof u === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((u) => typeof u === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function ClaimsQueuePage() {
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [profileTypeFilter, setProfileTypeFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const [reviewModal, setReviewModal] = useState<{
    claim: ClaimRequest;
    action: 'approve' | 'reject' | 'needs_info';
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stats
  const [stats, setStats] = useState<{
    pending: number;
    approved: number;
    rejected: number;
    needs_info: number;
  }>({ pending: 0, approved: 0, rejected: 0, needs_info: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (profileTypeFilter !== 'all') params.set('profileType', profileTypeFilter);

      const res = await fetch(`/api/admin/claims?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to load claims');
        setClaims([]);
        setTotal(0);
      } else {
        setClaims(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error('Claims load error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, profileTypeFilter]);

  const loadStats = useCallback(async () => {
    try {
      // Fetch each status count separately
      const [pending, approved, rejected, needs_info] = await Promise.all([
        fetch('/api/admin/claims?status=pending&limit=1', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/claims?status=approved&limit=1', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/claims?status=rejected&limit=1', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/claims?status=needs_info&limit=1', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      setStats({
        pending: pending.total || 0,
        approved: approved.total || 0,
        rejected: rejected.total || 0,
        needs_info: needs_info.total || 0,
      });
    } catch (err) {
      console.error('Stats load error:', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('status')) setStatusFilter(params.get('status')!);
      if (params.get('profileType')) setProfileTypeFilter(params.get('profileType')!);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function review(action: 'approve' | 'reject' | 'needs_info') {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/claims/${reviewModal.claim.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewNotes }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json?.error || 'Failed to review claim');
      } else {
        setReviewModal(null);
        setReviewNotes('');
        await Promise.all([load(), loadStats()]);
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">✅ Claims Queue</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review profile claims from real players, coaches, teams, and leagues.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`text-left rounded-xl border p-4 transition-colors ${
            statusFilter === 'pending'
              ? 'border-red-500/50 bg-red-500/10'
              : 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
          }`}
        >
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wider">Pending</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{stats.pending}</div>
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`text-left rounded-xl border p-4 transition-colors ${
            statusFilter === 'approved'
              ? 'border-emerald-500/50 bg-emerald-500/10'
              : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
          }`}
        >
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Approved</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{stats.approved}</div>
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`text-left rounded-xl border p-4 transition-colors ${
            statusFilter === 'rejected'
              ? 'border-slate-500/50 bg-slate-700/30'
              : 'border-slate-500/30 bg-slate-500/5 hover:bg-slate-500/10'
          }`}
        >
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rejected</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{stats.rejected}</div>
        </button>
        <button
          onClick={() => setStatusFilter('needs_info')}
          className={`text-left rounded-xl border p-4 transition-colors ${
            statusFilter === 'needs_info'
              ? 'border-amber-500/50 bg-amber-500/10'
              : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
          }`}
        >
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Needs Info</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{stats.needs_info}</div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0f141c] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
        >
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="needs_info">Needs Info</option>
        </select>
        <select
          value={profileTypeFilter}
          onChange={(e) => setProfileTypeFilter(e.target.value)}
          className="bg-[#0f141c] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
        >
          <option value="all">All profile types</option>
          <option value="player">Player</option>
          <option value="coach">Coach</option>
          <option value="team">Team</option>
          <option value="league">League</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading claims…</div>
        ) : error ? (
          <div className="p-12 text-center text-red-300 text-sm">⚠ {error}</div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No claims found in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#0b0e14] text-slate-500 uppercase tracking-wider">
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Profile Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Profile Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Evidence</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => {
                  const urls = parseEvidenceUrls(c.evidenceUrls);
                  const isOpen = expanded === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : c.id)}
                        className="border-b border-slate-800/40 hover:bg-slate-800/20 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          {c.user ? (
                            <div>
                              <div className="text-slate-200 font-medium">{c.user.name}</div>
                              <div className="text-slate-500 text-[10px]">@{c.user.handle}</div>
                              <div className="text-slate-500 text-[10px]">{c.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-slate-600">Unknown user</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{profileTypeBadge(c.profileType)}</td>
                        <td className="px-4 py-3 text-slate-200 font-medium">{c.profileName}</td>
                        <td className="px-4 py-3 text-slate-400">
                          <div>{urls.length} URL{urls.length === 1 ? '' : 's'}</div>
                          {c.evidenceNotes && (
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px] mt-0.5">
                              {c.evidenceNotes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">{statusBadge(c.status)}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{timeAgo(c.submittedAt)}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {c.status === 'pending' ? (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setReviewModal({ claim: c, action: 'approve' });
                                  setReviewNotes('');
                                }}
                                className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500/10"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setReviewModal({ claim: c, action: 'reject' });
                                  setReviewNotes('');
                                }}
                                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/10"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  setReviewModal({ claim: c, action: 'needs_info' });
                                  setReviewNotes('');
                                }}
                                className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded border border-amber-500/30 hover:bg-amber-500/10"
                              >
                                Request Info
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[10px]">Reviewed by {c.reviewer?.name || '—'}</span>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#0b0e14]">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Claim Email</div>
                                <div className="text-slate-300 font-mono">{c.claimEmail || '—'}</div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Claim Phone</div>
                                <div className="text-slate-300 font-mono">{c.claimPhone || '—'}</div>
                              </div>
                              <div className="md:col-span-2">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Evidence URLs</div>
                                {urls.length > 0 ? (
                                  <ul className="space-y-1">
                                    {urls.map((u, i) => (
                                      <li key={i}>
                                        <a
                                          href={u}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-amber-400 hover:text-amber-300 font-mono break-all"
                                        >
                                          {u}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="text-slate-600">No URLs provided</div>
                                )}
                              </div>
                              {c.evidenceNotes && (
                                <div className="md:col-span-2">
                                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Evidence Notes</div>
                                  <div className="text-slate-300 whitespace-pre-wrap">{c.evidenceNotes}</div>
                                </div>
                              )}
                              {c.reviewNotes && (
                                <div className="md:col-span-2">
                                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Review Notes</div>
                                  <div className="text-slate-300 whitespace-pre-wrap">{c.reviewNotes}</div>
                                </div>
                              )}
                              {c.reviewedAt && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Reviewed At</div>
                                  <div className="text-slate-300">{new Date(c.reviewedAt).toLocaleString()}</div>
                                </div>
                              )}
                              {c.reviewer && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Reviewer</div>
                                  <div className="text-slate-300">{c.reviewer.name} (@{c.reviewer.handle})</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
            <div>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="px-2 tabular-nums">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white capitalize">
                {reviewModal.action === 'needs_info' ? 'Request Info' : reviewModal.action} Claim
              </h2>
              <button
                onClick={() => setReviewModal(null)}
                className="text-slate-500 hover:text-slate-300 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="bg-[#0b0e14] border border-slate-800 rounded-lg p-3 mb-4 text-xs">
              <div className="text-slate-500">Claiming:</div>
              <div className="text-slate-200 font-semibold mt-1">
                {reviewModal.claim.profileName}
                <span className="ml-2 text-slate-500">({reviewModal.claim.profileType})</span>
              </div>
              <div className="text-slate-500 mt-1">
                by {reviewModal.claim.user?.name || 'Unknown'} (@{reviewModal.claim.user?.handle || '—'})
              </div>
            </div>

            {reviewModal.action === 'approve' && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300 mb-4">
                ✓ Approving will set the profile's <code className="font-mono">claimedById</code> to this user,
                set <code className="font-mono">claimedAt=now</code>, and mark <code className="font-mono">verified=true</code>.
              </div>
            )}

            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Review Notes (optional)
            </label>
            <textarea
              rows={4}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes for the user (they will be visible to them)…"
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => review(reviewModal.action)}
                disabled={submitting}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 ${
                  reviewModal.action === 'approve'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                    : reviewModal.action === 'reject'
                    ? 'bg-red-500 text-white hover:bg-red-400'
                    : 'bg-amber-400 text-slate-900 hover:bg-amber-300'
                }`}
              >
                {submitting
                  ? 'Submitting…'
                  : reviewModal.action === 'needs_info'
                  ? 'Request Info'
                  : reviewModal.action === 'approve'
                  ? 'Approve Claim'
                  : 'Reject Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

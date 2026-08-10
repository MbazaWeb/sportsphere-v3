'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface VerificationRequest {
  id: string;
  userId: string;
  role: string;
  roleId: string | null;
  roleTypeId: string | null;
  roleData: any;
  status: string;
  adminNotes: string | null;
  reviewedBy: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    handle: string;
    avatarUrl: string | null;
    avatarInitials: string | null;
    currentCountry: string | null;
    role: string;
    isVerified: boolean;
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VerificationsPage() {
  const [data, setData] = useState<{ requests: VerificationRequest[]; counts: any }>({
    requests: [],
    counts: { pending: 0, approved: 0, rejected: 0, total: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verifications?status=${tab}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to load verifications.');
        setData({ requests: [], counts: { pending: 0, approved: 0, rejected: 0, total: 0 } });
      } else {
        setData(json);
      }
    } catch (err) {
      console.error('Verifications load error:', err);
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function process(req: VerificationRequest, action: 'approve' | 'reject') {
    const adminNotes = notesMap[req.id] || '';
    if (action === 'reject' && !adminNotes.trim()) {
      alert('Please provide a reason in the notes field before rejecting.');
      return;
    }
    setProcessingId(req.id);
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: req.id, action, adminNotes }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json?.error || 'Failed to process verification.');
      } else {
        setNotesMap((prev) => {
          const next = { ...prev };
          delete next[req.id];
          return next;
        });
        await load();
      }
    } catch {
      alert('Network error.');
    } finally {
      setProcessingId(null);
    }
  }

  const tabs: Array<{ key: typeof tab; label: string; count: number; color: string }> = [
    { key: 'pending', label: 'Pending', count: data.counts.pending, color: 'text-amber-300' },
    { key: 'approved', label: 'Approved', count: data.counts.approved, color: 'text-emerald-300' },
    { key: 'rejected', label: 'Rejected', count: data.counts.rejected, color: 'text-red-300' },
    { key: 'all', label: 'All', count: data.counts.total, color: 'text-slate-300' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">✅ KYC Verifications</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review verification requests from users upgrading to Player, Coach, Team, or
          League roles. Approvals update the user&apos;s role and verified status.
          Rejects require a reason. All actions are audit-logged.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
            <span className={`ml-2 text-xs ${t.color}`}>
              ({t.count})
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          ⚠ {error}
        </div>
      )}

      {/* Queue */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-[#0f141c] p-4">
              <div className="skeleton h-6 w-48 mb-2" />
              <div className="skeleton h-4 w-full mb-1" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          ))
        ) : data.requests.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-12 text-center text-slate-500">
            No {tab === 'all' ? '' : tab} verification requests.
          </div>
        ) : (
          data.requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-slate-800 bg-[#0f141c] p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold text-slate-900 overflow-hidden">
                    {req.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={req.user.avatarUrl} alt={req.user.name} className="w-full h-full object-cover" />
                    ) : (
                      req.user.avatarInitials || req.user.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      {req.user.name}
                      <span className="ml-2 text-xs text-slate-500">@{req.user.handle}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {req.user.email} · {req.user.currentCountry || 'Unknown country'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-bold uppercase tracking-wider">
                    Requesting: {req.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    req.status === 'pending'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                      : req.status === 'approved'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/15 border border-red-500/30 text-red-300'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Role data */}
              {req.roleData && Object.keys(req.roleData).length > 0 && (
                <div className="mb-3 rounded-lg bg-[#0b0e14] border border-slate-800 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Submitted Role Data
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(req.roleData).slice(0, 8).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-slate-500">{k}:</span>{' '}
                        <span className="text-slate-200 truncate">
                          {typeof v === 'string' || typeof v === 'number' ? String(v) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submitted / reviewed timestamps */}
              <div className="text-xs text-slate-500 mb-3">
                Submitted: {formatDate(req.submittedAt)}
                {req.reviewedAt && (
                  <span className="ml-4">Reviewed: {formatDate(req.reviewedAt)}</span>
                )}
                {req.adminNotes && (
                  <div className="mt-1 text-slate-400">
                    <strong className="text-slate-300">Admin notes:</strong> {req.adminNotes}
                  </div>
                )}
              </div>

              {/* Actions (only for pending) */}
              {req.status === 'pending' && (
                <div className="border-t border-slate-800 pt-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Admin notes (required for reject, optional for approve)…"
                    value={notesMap[req.id] || ''}
                    onChange={(e) => setNotesMap((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full rounded-lg bg-[#0b0e14] border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => process(req, 'approve')}
                      disabled={processingId === req.id}
                      className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                      {processingId === req.id ? 'Processing…' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => process(req, 'reject')}
                      disabled={processingId === req.id}
                      className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                      {processingId === req.id ? 'Processing…' : '✕ Reject'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!loading && data.requests.length > 0 && (
        <div className="mt-4 text-xs text-slate-500">
          Showing {data.requests.length} {tab} request{data.requests.length === 1 ? '' : 's'}.
        </div>
      )}
    </div>
  );
}

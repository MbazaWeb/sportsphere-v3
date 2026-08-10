'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface RoleRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  roleId?: string;
  roleName?: string;
  roleTypeId?: string;
  roleTypeName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  roleData?: Record<string, string>;
}

export default function RolesPage() {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/roles?status=pending', {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to load role requests.');
        setRequests([]);
      } else {
        setRequests(Array.isArray(data) ? data : data.requests || []);
      }
    } catch (err) {
      console.error('Roles load error:', err);
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(req: RoleRequest, action: 'approved' | 'rejected') {
    setActingId(req.id);
    try {
      const res = await fetch(`/api/admin/roles/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== req.id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || `Failed to ${action} request.`);
      }
    } catch {
      alert('Network error.');
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Role Approvals</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review and act on user requests to upgrade their role (player,
          coach, team, league, etc.). Decisions write through to the fan app.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          ⚠ {error}
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-800 bg-[#0f141c] p-5"
            >
              <div className="skeleton h-5 w-1/3 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-2" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          ))
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-lg font-semibold text-slate-200">
              All caught up
            </div>
            <p className="text-sm text-slate-400 mt-1">
              There are no pending role requests right now.
            </p>
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-800 bg-[#0f141c] p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-slate-100">
                      {r.userName || 'Unknown user'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {r.userEmail}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-semibold uppercase tracking-wider">
                      {r.roleName || 'role'} → {r.roleTypeName || 'type'}
                    </span>
                  </div>
                  {r.createdAt && (
                    <div className="text-xs text-slate-500 mb-3">
                      Requested {new Date(r.createdAt).toLocaleString()}
                    </div>
                  )}
                  {r.roleData && Object.keys(r.roleData).length > 0 && (
                    <div className="rounded-lg border border-slate-800 bg-[#0b0e14] p-3 text-xs">
                      <div className="font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Submitted data
                      </div>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        {Object.entries(r.roleData).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <dt className="text-slate-500">{k}:</dt>
                            <dd className="text-slate-200 break-all">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => act(r, 'approved')}
                    disabled={actingId === r.id}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => act(r, 'rejected')}
                    disabled={actingId === r.id}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-semibold uppercase tracking-wider hover:bg-red-500/25 transition-colors disabled:opacity-50"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

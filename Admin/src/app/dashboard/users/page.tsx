'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: string;
  isVerified: boolean;
  verificationStatus: string;
  registeredAt?: string;
  lastSeenAt?: string;
  followerCount?: number;
  postCount?: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to load users.');
        setUsers([]);
      } else {
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Users load error:', err);
      setError('Network error.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [query, roleFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce
    return () => clearTimeout(t);
  }, [load]);

  async function changeRole(user: UserItem, newRole: string) {
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || 'Failed to change role.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleVerified(user: UserItem) {
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isVerified: !user.isVerified,
          verificationStatus: !user.isVerified ? 'verified' : 'none',
        }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  isVerified: !u.isVerified,
                  verificationStatus: !u.isVerified ? 'verified' : 'none',
                }
              : u
          )
        );
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || 'Failed to update verification.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users Manager</h1>
        <p className="text-sm text-slate-400 mt-1">
          Search users, change roles, and toggle verified status. Changes
          write directly to the database and are immediately visible to the
          fan web app and mobile app.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or handle…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg bg-[#0f141c] border border-slate-700 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg bg-[#0f141c] border border-slate-700 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
        >
          <option value="ALL">All Roles</option>
          <option value="fan">Fan</option>
          <option value="player">Player</option>
          <option value="coach">Coach</option>
          <option value="team">Team</option>
          <option value="league">League</option>
          <option value="administrator">Administrator</option>
        </select>
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
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">User</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">Verified</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">Stats</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">Joined</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/60">
                  <td className="px-4 py-3"><div className="skeleton h-5 w-32" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-20" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-16" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-20" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-24" /></td>
                  <td className="px-4 py-3"><div className="skeleton h-5 w-24 ml-auto" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.handle} · {u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      disabled={updatingId === u.id}
                      className="rounded bg-[#0b0e14] border border-slate-700 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-400/60 disabled:opacity-50"
                    >
                      <option value="fan">fan</option>
                      <option value="player">player</option>
                      <option value="coach">coach</option>
                      <option value="team">team</option>
                      <option value="league">league</option>
                      <option value="administrator">administrator</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    <div>{u.postCount ?? 0} posts</div>
                    <div>{u.followerCount ?? 0} followers</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleVerified(u)}
                      disabled={updatingId === u.id}
                      className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                        u.isVerified
                          ? 'bg-slate-500/15 border border-slate-500/40 text-slate-300 hover:bg-slate-500/25'
                          : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                      }`}
                    >
                      {u.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        {loading ? 'Loading…' : `${users.length} user${users.length === 1 ? '' : 's'} shown.`}
      </div>
    </div>
  );
}

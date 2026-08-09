"use client";
import { apiFetch } from '@/lib/api';
import React, { useEffect, useState, useCallback } from 'react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned?: boolean;
  bannedAt?: string | null;
  bannedReason?: string | null;
  registeredAt?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    params.set("page", String(page));
    params.set("limit", String(limit));

    apiFetch(`/api/admin/users?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
          setTotal(data.total ?? 0);
        } else {
          // Backward compat for older API response
          setUsers(Array.isArray(data) ? data : []);
          setTotal(Array.isArray(data) ? data.length : 0);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        setLoading(false);
      });
  }, [query, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const changeRole = async (id: string, newRole: string) => {
    try {
      const res = await apiFetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchUsers();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update role");
      }
    } catch (err) {
      console.error("Failed to update user role:", err);
    }
  };

  const toggleBan = async (id: string, currentBannedStatus: boolean) => {
    const action = currentBannedStatus ? "unban" : "ban";
    const reason = currentBannedStatus ? undefined : prompt(`Ban reason (optional):`);
    if (!currentBannedStatus && reason === null) return; // cancelled

    try {
      const body: Record<string, unknown> = { isBanned: !currentBannedStatus };
      if (reason) body.bannedReason = reason;
      const res = await apiFetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error("Failed to update user ban state:", err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Users Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            {total} total users. Search, update roles, or suspend accounts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            className="flex-1 bg-[#0f141c] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={fetchUsers}
            className="bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-amber-300 transition-colors"
          >
            Search
          </button>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-[#0f141c] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
        >
          <option value="ALL">All Roles</option>
          <option value="fan">Fan</option>
          <option value="player">Player</option>
          <option value="coach">Coach</option>
          <option value="team">Team</option>
          <option value="administrator">Administrator</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#141b26] text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-800/40 transition-colors ${u.isBanned ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-4 font-medium text-white">
                      <div>{u.name || "User"}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{u.email}</td>
                    <td className="px-4 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="bg-transparent border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="fan">Fan</option>
                        <option value="player">Player</option>
                        <option value="coach">Coach</option>
                        <option value="team">Team</option>
                        <option value="scout">Scout</option>
                        <option value="journalist">Journalist</option>
                        <option value="creator">Creator</option>
                        <option value="analyst">Analyst</option>
                        <option value="commentator">Commentator</option>
                        <option value="agent">Agent</option>
                        <option value="organization">Organization</option>
                        <option value="competition">Competition</option>
                        <option value="league">League</option>
                        <option value="academy">Academy</option>
                        <option value="venue">Venue</option>
                        <option value="business">Business</option>
                        <option value="moderator">Moderator</option>
                        <option value="administrator">Administrator</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      {u.isBanned ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <button
                        onClick={() => toggleBan(u.id, !!u.isBanned)}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors ${
                          u.isBanned
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                        }`}
                      >
                        {u.isBanned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {page} of {totalPages} ({total} users)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-white disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-white disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { adminFetch } from '@/lib/admin-api';

interface ClaimedBy {
  id: string;
  name: string;
  handle: string;
  email?: string;
}

interface IndexItem {
  id: string;
  entityType: "USER" | "TEAM" | "PLAYER";
  name: string;
  email?: string | null;
  handle?: string | null;
  role: string;
  isVerified: boolean;
  verificationStatus?: string;
  registeredAt?: string;
  lastSeenAt?: string;
  followerCount?: number | null;
  postCount?: number | null;
  claimStatus: "claimed" | "unclaimed" | "n/a";
  claimedBy?: ClaimedBy | null;
  claimedAt?: string | null;
  meta?: string | null;
  createdByAI?: boolean;
  source?: string | null;
}

const TYPE_TABS: { id: string; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "USER", label: "Accounts" },
  { id: "TEAM", label: "Teams" },
  { id: "PLAYER", label: "Players" },
];

function ClaimBadge({ item }: { item: IndexItem }) {
  if (item.claimStatus === "n/a") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
        —
      </span>
    );
  }
  if (item.claimStatus === "claimed") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-semibold uppercase tracking-wider w-fit">
          Claimed
        </span>
        {item.claimedBy && (
          <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
            by {item.claimedBy.name}
            {item.claimedBy.handle ? ` (${item.claimedBy.handle})` : ""}
          </span>
        )}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold uppercase tracking-wider">
      Unclaimed
    </span>
  );
}

function TypeBadge({ type }: { type: IndexItem["entityType"] }) {
  const styles =
    type === "USER"
      ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
      : type === "TEAM"
        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
        : "bg-orange-500/15 border-orange-500/30 text-orange-300";
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${styles}`}
    >
      {type}
    </span>
  );
}

export default function UsersPage() {
  const [items, setItems] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      params.set("limit", "80");
      const res = await adminFetch(`/api/admin/users?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to load index.");
        setItems([]);
      } else {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Users load error:", err);
      setError("Network error.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query, roleFilter, typeFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function changeRole(user: IndexItem, newRole: string) {
    if (user.entityType !== "USER") return;
    setUpdatingId(user.id);
    try {
      const res = await adminFetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "Failed to change role.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleVerified(user: IndexItem) {
    if (user.entityType !== "USER") return;
    setUpdatingId(user.id);
    try {
      const res = await adminFetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !user.isVerified }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  isVerified: !u.isVerified,
                  verificationStatus: !u.isVerified ? "verified" : "unverified",
                }
              : u
          )
        );
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "Failed to update verification.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setUpdatingId(null);
    }
  }

  const counts = {
    USER: items.filter((i) => i.entityType === "USER").length,
    TEAM: items.filter((i) => i.entityType === "TEAM").length,
    PLAYER: items.filter((i) => i.entityType === "PLAYER").length,
    claimed: items.filter((i) => i.claimStatus === "claimed").length,
    unclaimed: items.filter((i) => i.claimStatus === "unclaimed").length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users Manager</h1>
        <p className="text-sm text-slate-400 mt-1">
          Unified index of accounts, teams, and players. Teams and players
          created in Admin (or synced) appear here with claim status so you can
          see what is claimed vs still open.
        </p>
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTypeFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-colors ${
              typeFilter === tab.id
                ? "bg-amber-400/15 border-amber-400/40 text-amber-300"
                : "bg-[#0f141c] border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, email, handle, team, player…"
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

      {/* Stats strip */}
      <div className="flex flex-wrap gap-3 mb-4 text-[11px] text-slate-400">
        <span className="px-2 py-1 rounded bg-slate-800/60">Accounts: {counts.USER}</span>
        <span className="px-2 py-1 rounded bg-slate-800/60">Teams: {counts.TEAM}</span>
        <span className="px-2 py-1 rounded bg-slate-800/60">Players: {counts.PLAYER}</span>
        <span className="px-2 py-1 rounded bg-sky-500/10 text-sky-300">Claimed: {counts.claimed}</span>
        <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-300">Unclaimed: {counts.unclaimed}</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          ⚠ {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#141b26] border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                Entity
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                Role
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                Claim status
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                Verified
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                Stats
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                Created
              </th>
              <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  No accounts, teams, or players found.
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr
                  key={`${u.entityType}-${u.id}`}
                  className="border-b border-slate-800/60 hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{u.name}</div>
                    <div className="text-xs text-slate-500">
                      {[u.handle, u.email].filter(Boolean).join(" · ") || "—"}
                    </div>
                    {u.meta && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{u.meta}</div>
                    )}
                    {u.createdByAI && (
                      <span className="mt-1 inline-flex text-[9px] uppercase tracking-wider text-fuchsia-300/80">
                        AI created
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={u.entityType} />
                  </td>
                  <td className="px-4 py-3">
                    {u.entityType === "USER" ? (
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
                    ) : (
                      <span className="text-xs text-slate-400 uppercase">{u.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ClaimBadge item={u} />
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
                    {u.entityType === "USER" ? (
                      <>
                        <div>{u.postCount ?? 0} posts</div>
                        <div>{u.followerCount ?? 0} followers</div>
                      </>
                    ) : (
                      <div className="text-slate-500">{u.source || "—"}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {u.registeredAt
                      ? new Date(u.registeredAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.entityType === "USER" ? (
                      <button
                        onClick={() => toggleVerified(u)}
                        disabled={updatingId === u.id}
                        className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                          u.isVerified
                            ? "bg-slate-500/15 border border-slate-500/40 text-slate-300 hover:bg-slate-500/25"
                            : "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"
                        }`}
                      >
                        {u.isVerified ? "Unverify" : "Verify"}
                      </button>
                    ) : u.entityType === "TEAM" ? (
                      <a
                        href={`/dashboard/teams/${u.id}`}
                        className="px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-500/15 border border-slate-500/40 text-slate-300 hover:bg-slate-500/25"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-600">Indexed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        {loading
          ? "Loading…"
          : `${items.length} record${items.length === 1 ? "" : "s"} shown (accounts + teams + players).`}
      </div>
    </div>
  );
}

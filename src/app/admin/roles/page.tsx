"use client";
import React, { useEffect, useState, useCallback } from "react";

interface VerificationRequest {
  id: string;
  userId: string;
  role: string;
  roleId: string;
  roleTypeId: string;
  roleData: Record<string, string>;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    handle: string;
    avatarUrl: string | null;
    role: string;
    verificationStatus: string;
  };
}

const STATUS_OPTIONS = ["pending", "verified", "rejected", "ALL"] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

export default function AdminRolesPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/roles?status=${filter}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/roles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          action === "approve" ? "✅ Approved — verified badge granted!" : "❌ Rejected",
          action === "approve"
        );
        load();
      } else {
        showToast(data.error || "Action failed", false);
      }
    } catch {
      showToast("Network error", false);
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "pending") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 text-[11px] font-semibold text-yellow-400">
        ⏳ Pending
      </span>
    );
    if (status === "verified") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
        ✅ Verified
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-400">
        ❌ Rejected
      </span>
    );
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-semibold shadow-xl border ${
          toast.ok
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/10 border-red-500/30 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">PRO Role Approvals</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review fan upgrade requests. Individual roles (Player, Coach, Scout, etc.) auto-approve. Others require manual review.
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div>
            <p className="text-sm font-semibold text-amber-400 mb-1">Auto-approval policy</p>
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Individual roles</strong> (Player, Coach, Scout, Referee, Journalist, etc.) are auto-approved instantly — fans get their verified badge immediately.{" "}
              <strong className="text-slate-300">Team, Club, Organization, and Admin roles</strong> require manual approval here.
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === s
                ? "bg-amber-400 text-black"
                : "border border-slate-700 text-slate-400 hover:text-white hover:border-amber-400/50"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-8 text-center text-slate-400">
          Loading requests…
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-12 text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <p className="text-slate-300 font-semibold">No {filter === "ALL" ? "" : filter} requests</p>
          <p className="text-sm text-slate-500 mt-1">
            {filter === "pending" ? "All caught up! No pending role upgrade requests." : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-[#141b26]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Requested Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                {filter !== "verified" && filter !== "rejected" && (
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{req.user.name}</div>
                    <div className="text-xs text-slate-400">{req.user.email}</div>
                    <div className="text-xs text-slate-500">{req.user.handle}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-amber-400 capitalize">{req.role}</div>
                  </td>
                  <td className="px-5 py-4">
                    {statusBadge(req.status)}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">
                    {new Date(req.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </td>
                  {filter !== "verified" && filter !== "rejected" && (
                    <td className="px-5 py-4 text-right">
                      {req.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={processing === req.id}
                            onClick={() => handleAction(req.id, "approve")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            {processing === req.id ? "…" : "✅ Approve"}
                          </button>
                          <button
                            disabled={processing === req.id}
                            onClick={() => handleAction(req.id, "reject")}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            {processing === req.id ? "…" : "❌ Reject"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

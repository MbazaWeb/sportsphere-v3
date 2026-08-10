"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from '@/lib/api';

interface Stats {
  users: number;
  posts: number;
  sports: number;
  pendingRoles: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load admin stats:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">System Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Overview of platform activity, user counts, and pending moderation requests.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-400">Total Users</div>
          <div className="text-3xl font-bold text-amber-400 mt-2">
            {loading ? "..." : stats?.users ?? 0}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-400">Total Posts</div>
          <div className="text-3xl font-bold text-amber-400 mt-2">
            {loading ? "..." : stats?.posts ?? 0}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-400">Active Sports</div>
          <div className="text-3xl font-bold text-amber-400 mt-2">
            {loading ? "..." : stats?.sports ?? 0}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-400">Pending Role Requests</div>
          <div className="text-3xl font-bold text-amber-400 mt-2">
            {loading ? "..." : stats?.pendingRoles ?? 0}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="block p-4 rounded-lg border border-slate-800 bg-[#141b26] hover:border-amber-400/50 transition-colors"
          >
            <div className="font-semibold text-amber-400">Manage Users</div>
            <div className="text-xs text-slate-400 mt-1">Search, ban/unban, or change permissions</div>
          </Link>
          <Link
            href="/admin/sports"
            className="block p-4 rounded-lg border border-slate-800 bg-[#141b26] hover:border-amber-400/50 transition-colors"
          >
            <div className="font-semibold text-amber-400">Manage Sports</div>
            <div className="text-xs text-slate-400 mt-1">Add new sports categories and toggles</div>
          </Link>
          <Link
            href="/admin/posts"
            className="block p-4 rounded-lg border border-slate-800 bg-[#141b26] hover:border-amber-400/50 transition-colors"
          >
            <div className="font-semibold text-amber-400">Moderate Posts</div>
            <div className="text-xs text-slate-400 mt-1">Review activity feeds and delete reported content</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

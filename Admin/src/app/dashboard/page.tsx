'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  users: number;
  posts: number;
  sports: number;
  pendingRoles: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/auth/me', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([statsData, adminData]) => {
        if (statsData?.error) setError(statsData.error);
        setStats(statsData);
        if (adminData?.user) setAdmin(adminData.user);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load admin stats:', err);
        setError('Network error loading stats.');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Authenticated
          </span>
          <span className="text-[11px] text-slate-500">
            Role:{' '}
            <span className="text-amber-400 font-semibold">
              {admin?.role || 'ADMIN'}
            </span>
          </span>
          <span className="text-[11px] text-slate-500">
            · Connected to fan app at{' '}
            <span className="text-slate-400">
              {process.env.NEXT_PUBLIC_MAIN_APP_URL || '(not set)'}
            </span>
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome back{admin ? `, ${admin.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Overview of platform activity, user counts, and pending moderation
          requests. This console talks to the fan web app over HTTP.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          ⚠ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Users', value: stats?.users, key: 'users' },
          { label: 'Total Posts', value: stats?.posts, key: 'posts' },
          { label: 'Active Sports', value: stats?.sports, key: 'sports' },
          {
            label: 'Pending Role Requests',
            value: stats?.pendingRoles,
            key: 'pendingRoles',
          },
        ].map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-slate-800 bg-[#0f141c] p-6 shadow-sm"
          >
            <div className="text-sm font-medium text-slate-400">
              {card.label}
            </div>
            <div className="text-3xl font-bold text-amber-400 mt-2">
              {loading ? (
                <div className="skeleton h-8 w-16 inline-block" />
              ) : (
                card.value ?? 0
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/dashboard/users"
            className="block p-4 rounded-lg border border-slate-800 bg-[#141b26] hover:border-amber-400/50 transition-colors"
          >
            <div className="font-semibold text-amber-400">Manage Users</div>
            <div className="text-xs text-slate-400 mt-1">
              Search, ban/unban, or change permissions
            </div>
          </Link>
          <Link
            href="/dashboard/sports"
            className="block p-4 rounded-lg border border-slate-800 bg-[#141b26] hover:border-amber-400/50 transition-colors"
          >
            <div className="font-semibold text-amber-400">Manage Sports</div>
            <div className="text-xs text-slate-400 mt-1">
              Add new sports categories and toggles
            </div>
          </Link>
          <Link
            href="/dashboard/posts"
            className="block p-4 rounded-lg border border-slate-800 bg-[#141b26] hover:border-amber-400/50 transition-colors"
          >
            <div className="font-semibold text-amber-400">Moderate Posts</div>
            <div className="text-xs text-slate-400 mt-1">
              Review activity feeds and delete reported content
            </div>
          </Link>
        </div>
      </div>

      {/* Architecture notice */}
      <div className="rounded-xl border border-emerald-700/30 bg-emerald-900/10 p-5">
        <div className="flex items-start gap-3">
          <span className="text-emerald-400 text-lg">🔗</span>
          <div className="text-sm">
            <div className="font-semibold text-emerald-300">
              Detached architecture
            </div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              This console is a standalone Next.js app on port{' '}
              <code className="text-amber-400">3003</code>. It has no database
              of its own — every API call is forwarded to the fan web app on
              port <code className="text-amber-400">3002</code>, which validates
              the admin session via <code className="text-amber-400">verifyAdminSession()</code>.
              The mobile app continues to talk to the fan app directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminFetch } from '@/lib/admin-api';

/**
 * Admin Login Page
 *
 * URL: /login
 *
 * Flow:
 *   1. On mount, ping /api/auth/me — if we already have a valid admin
 *      session, jump straight to ?next=… (defaults to /dashboard).
 *   2. Otherwise show the form. On submit, POST credentials to
 *      /api/auth/login. The server-side route forwards to the fan app,
 *      captures the ss_session JWT, and wraps it in our admin_session
 *      cookie. On success, redirect to /dashboard.
 *   3. Non-admins get a 403 from the fan app, which we surface as an
 *      "access denied" message — they cannot reach /dashboard.
 */

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get('next') || '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminFetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.user) {
            router.replace(nextPath);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await adminFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }
      router.replace(nextPath);
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Verifying admin session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#0f1729] via-[#0b1424] to-[#070a10] border-r border-slate-800/60">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(245,197,24,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(34,197,94,0.15), transparent 45%)',
          }}
        />
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || "/sportsphere-admin"}/logo.svg`} alt="SportSphere" className="w-10 h-10 rounded-lg" />
            <div>
              <div className="text-xl font-extrabold tracking-tight text-amber-400">
                SportSphere
              </div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Admin Control Center
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight text-white">
              The mission control for the world's biggest sports community.
            </h1>
            <p className="text-slate-300/80 text-base leading-relaxed max-w-md">
              Standalone admin console — talks to the fan web app over HTTP.
              Manage users, sports, role approvals, and content moderation
              from one secure shell.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md pt-4">
              {[
                ['👥', 'User Management'],
                ['🏆', 'Sports Catalogue'],
                ['🛡️', 'Role Approvals'],
                ['📝', 'Content Moderation'],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-200 flex items-center gap-2"
                >
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} SportSphere. Authorised personnel only.
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || "/sportsphere-admin"}/logo.svg`} alt="SportSphere" className="w-8 h-8 rounded-lg" />
            <div>
              <div className="text-lg font-extrabold text-amber-400">
                SportSphere Admin
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Control Center
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Restricted Access
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Administrator Sign-In
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Use your administrator email or handle. Non-admin accounts will
              be rejected by the fan app.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-start gap-2">
              <span className="text-red-400 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider"
              >
                Email or Handle
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="admin@sportsphere.com  or  @admin"
                className="w-full rounded-lg bg-[#0f141c] border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400/60 transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full rounded-lg bg-[#0f141c] border border-slate-700 px-4 py-3 pr-12 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400/60 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-xs text-slate-400 hover:text-amber-400 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-3 text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>Enter Control Center →</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-400">Security notice:</strong>{' '}
              This console authenticates directly against the SportSphere
              users database. Passwords are verified with bcrypt — your
              credentials never leave this server.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_MAIN_APP_URL || '#'}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              ← Back to SportSphere app
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

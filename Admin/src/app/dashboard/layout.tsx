'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: string;
  avatarUrl?: string | null;
  avatarInitials?: string | null;
  isVerified: boolean;
}

const NAV = [
  { href: "/dashboard/admins", label: "🔑 Admin Delegation" },
  { href: '/dashboard', label: '📊 Overview', exact: true },
  { href: '/dashboard/users', label: '👥 Users Manager' },
  { href: '/dashboard/sports', label: '🏆 Sports Manager', exact: true },
  { href: '/dashboard/sports-sync', label: '⚡ Sports Sync' },
  { href: '/dashboard/roles', label: '🛡️ Role Approvals' },
  { href: '/dashboard/posts', label: '📝 Content Moderation' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (cancelled) return;
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data?.user) {
          setAdmin(data.user);
        } else {
          router.replace('/login');
          return;
        }
      } catch {
        if (!cancelled) router.replace('/login');
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    router.replace('/login');
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading admin console…</p>
        </div>
      </div>
    );
  }

  const initials =
    admin?.avatarInitials || (admin?.name || 'A').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#0f141c] p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-2xl">⚽</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-amber-400 leading-tight">
                SportSphere
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Admin Console
              </p>
            </div>
          </div>

          {/* Admin profile chip */}
          {admin && (
            <div className="mb-6 rounded-lg border border-slate-800 bg-[#0b0e14] p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-slate-900 overflow-hidden">
                {admin.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={admin.avatarUrl}
                    alt={admin.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-100 truncate">
                  {admin.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {admin.handle}
                </div>
              </div>
              <span
                className="w-2 h-2 rounded-full bg-emerald-400"
                title="Active session"
              />
            </div>
          )}

          <nav className="space-y-1">
            {NAV.map(({ href, label, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      : 'hover:bg-slate-800/80 hover:text-amber-400 text-slate-300'
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 pt-6">
          <a
            href={process.env.NEXT_PUBLIC_MAIN_APP_URL || '#'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2"
          >
            ↗ Open SportSphere app
          </a>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 border border-red-500/30 rounded-lg py-2 transition-colors disabled:opacity-50"
          >
            {loggingOut ? 'Signing out…' : '⎋ Sign out of admin'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}

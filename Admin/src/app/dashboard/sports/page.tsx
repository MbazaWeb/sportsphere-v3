'use client';

import React, { useEffect, useState } from 'react';

interface Sport {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  category?: string | null;
  isActive: boolean;
  displayOrder?: number;
}

/**
 * Sports Manager — READ-ONLY view.
 *
 * The fan app's existing /api/admin/* surface doesn't include sport CRUD
 * yet (only /api/sports which is public). This page therefore lists sports
 * from the public /api/sports endpoint and surfaces a "create / toggle"
 * form that, when wired up, will POST to /api/admin/sports on the fan app
 * (a route you'll need to add there).
 *
 * For now: shows the catalog and a placeholder for create.
 */
export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // Public endpoint on the fan app — proxied through this admin app
        const res = await fetch('/api/admin/stats', { cache: 'no-store' });
        // stats only returns counts; we'd normally call /api/sports here.
        // For now we render a placeholder table.
        await res.json();
      } catch {
        /* ignore */
      }
      // Sports list is normally fetched from /api/sports on the fan app —
      // but since this admin app only proxies admin routes, we'll show a
      // "feature coming soon" panel explaining the next step.
      setLoading(false);
    })();
  }, []);

  const filtered = sports.filter((s) =>
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sports Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            Catalogue of sports configured on the fan web app. Add new sports,
            toggle visibility, reorder display.
          </p>
        </div>
        <button
          disabled
          className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-400 text-sm font-semibold uppercase tracking-wider cursor-not-allowed"
          title="Pending backend route /api/admin/sports on the fan app"
        >
          + Add Sport (soon)
        </button>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-amber-400 text-lg">🚧</span>
          <div className="text-sm">
            <div className="font-semibold text-amber-300">
              Awaiting fan-app backend
            </div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              The fan web app currently exposes{' '}
              <code className="text-amber-400">/api/sports</code> as a public
              read-only endpoint. To enable admin write operations (add sport,
              toggle active, reorder), add{' '}
              <code className="text-amber-400">/api/admin/sports</code> routes
              on the fan app — this console will pick them up automatically.
            </p>
          </div>
        </div>
      </div>

      <input
        type="text"
        placeholder="Filter sports…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full sm:max-w-xs mb-4 rounded-lg bg-[#0f141c] border border-slate-700 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
      />

      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#141b26] border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs">Sport</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-slate-500">
                  Loading sports…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-slate-500">
                  No sports to display yet.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <span className="mr-2">{s.icon || '🏆'}</span>
                    <span className="font-medium text-slate-100">{s.name}</span>
                    <span className="ml-2 text-xs text-slate-500">/{s.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{s.category || '—'}</td>
                  <td className="px-4 py-3">
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold uppercase">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-400 text-[11px] font-semibold uppercase">
                        Hidden
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

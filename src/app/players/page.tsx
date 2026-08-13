'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Users, ChevronLeft } from 'lucide-react';
import PlayerSearchBar from '@/components/PlayerSearchBar';
import { apiFetch } from '@/lib/api';

interface PlayerRow {
  id: string;
  full_name: string;
  handle?: string;
  photo_url: string | null;
  position: string | null;
  current_team: string | null;
  ppi_score: number;
  nationality?: string | null;
}

export default function PlayersIndexPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/players?limit=40');
      if (!res.ok) throw new Error('Failed to load players');
      const data = await res.json();
      setPlayers(data.players || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#0A1628] text-white pb-24">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A1628]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/" className="rounded-lg p-2 hover:bg-white/5" aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <h1 className="text-lg font-semibold">Players</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <PlayerSearchBar />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-400">All players</h2>
            {!loading && (
              <span className="text-xs text-slate-500">{players.length} shown</span>
            )}
          </div>

          {loading && (
            <p className="py-12 text-center text-sm text-slate-400">Loading players…</p>
          )}

          {error && (
            <p className="py-8 text-center text-sm text-red-400">{error}</p>
          )}

          {!loading && !error && players.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-slate-500" />
              <p className="text-sm text-slate-300">No player profiles yet.</p>
              <p className="mt-1 text-xs text-slate-500">
                Players appear here once users complete a player profile.
              </p>
              <Link
                href="/leaderboard"
                className="mt-4 inline-block text-sm text-emerald-400 hover:underline"
              >
                View leaderboard →
              </Link>
            </div>
          )}

          <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10">
            {players.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/players/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-sm font-bold text-emerald-400">
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (p.full_name || '?').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{p.full_name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {[p.position, p.current_team].filter(Boolean).join(' · ') || 'Athlete'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400">
                    PPI {p.ppi_score ?? 0}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

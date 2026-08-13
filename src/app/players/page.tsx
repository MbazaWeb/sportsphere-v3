'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  ChevronLeft,
  Trophy,
  Medal,
  Crown,
} from 'lucide-react';
import PlayerSearchBar from '@/components/PlayerSearchBar';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

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

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  avatarInitials: string | null;
  points: number;
  performanceScore: number;
  tier: string;
  position: string | null;
  currentTeam?: string | null;
  ppiScore?: number;
  isVerified?: boolean;
  rankMovement?: number;
}

type Tab = 'all' | 'leaderboard';

export default function PlayersIndexPage() {
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
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

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/leaderboard?role=player&limit=40');
      if (!res.ok) throw new Error('Failed to load player leaderboard');
      const data = await res.json();
      setBoard(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setBoard([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'leaderboard') loadBoard();
    else loadAll();
  }, [tab, loadAll, loadBoard]);

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
          <Link
            href="/leaderboard?role=player"
            className="ml-auto text-xs text-amber-400 hover:underline"
          >
            Full rankings →
          </Link>
        </div>

        <div className="mx-auto flex max-w-3xl gap-1 px-4 pb-3">
          {(
            [
              { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
              { id: 'all' as const, label: 'All players', icon: Users },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                tab === id
                  ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                  : 'text-slate-400 hover:bg-white/5',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <PlayerSearchBar />

        {loading && (
          <p className="py-12 text-center text-sm text-slate-400">Loading…</p>
        )}
        {error && (
          <p className="py-8 text-center text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && tab === 'leaderboard' && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Trophy className="h-4 w-4 text-amber-400" />
                Player rankings
              </h2>
              <span className="text-xs text-slate-500">{board.length} ranked</span>
            </div>

            {board.length === 0 ? (
              <EmptyState
                title="No ranked players yet"
                body="Players appear here once they have a player profile or performance points."
              />
            ) : (
              <ul className="overflow-hidden rounded-2xl border border-white/10 divide-y divide-white/5">
                {board.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={`/players/${entry.id}`}
                      className="flex items-center gap-3 px-3 py-3 transition hover:bg-white/5"
                    >
                      <RankBadge rank={entry.rank} />
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-sm font-bold text-emerald-400">
                        {entry.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (entry.avatarInitials ||
                            entry.name.slice(0, 2)
                          ).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">
                          {entry.name}
                          {entry.isVerified && (
                            <span className="ml-1 text-emerald-400">✓</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {[entry.position, entry.currentTeam]
                            .filter(Boolean)
                            .join(' · ') || entry.handle}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-amber-400">
                          {entry.points.toLocaleString()}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">
                          {entry.tier}
                          {typeof entry.ppiScore === 'number' && entry.ppiScore > 0
                            ? ` · PPI ${entry.ppiScore}`
                            : ''}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!loading && !error && tab === 'all' && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-400">All players</h2>
              <span className="text-xs text-slate-500">{players.length} shown</span>
            </div>

            {players.length === 0 ? (
              <EmptyState
                title="No player profiles yet"
                body="Players appear here once users complete a player profile."
              />
            ) : (
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
                          <img
                            src={p.photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (p.full_name || '?').slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">
                          {p.full_name}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {[p.position, p.current_team].filter(Boolean).join(' · ') ||
                            'Athlete'}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400">
                        PPI {p.ppi_score ?? 0}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
        <Crown className="h-4 w-4" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-400/20 text-slate-300">
        <Medal className="h-4 w-4" />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-700/30 text-orange-400">
        <Medal className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold tabular-nums text-slate-500">
      {rank}
    </span>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
      <Search className="mx-auto mb-3 h-8 w-8 text-slate-500" />
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{body}</p>
      <Link
        href="/leaderboard"
        className="mt-4 inline-block text-sm text-emerald-400 hover:underline"
      >
        View full leaderboard →
      </Link>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, BarChart3, Goal, Clock, Info, Users, MapPin, Trophy,
  UserRound, Shirt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MatchEvent {
  minute: number;
  type: string;
  player: string;
  team: string;
  detail?: string;
  assist?: string;
}

export interface MatchStatRow {
  label: string;
  home: number | string;
  away: number | string;
}

export interface MatchPlayerLine {
  name: string;
  team: 'home' | 'away';
  role?: string;
  number?: string | number;
  events?: string[];
}

export interface ApiMatch {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: number | null;
  venue: string | null;
  kickoffAt: string;
  events?: MatchEvent[];
  stats?: MatchStatRow[];
  players?: MatchPlayerLine[];
  coaches?: { home?: string; away?: string };
  continent?: string;
  country?: string;
  homeBadge?: string;
  awayBadge?: string;
}

interface MatchDetailModalProps {
  match: ApiMatch;
  onClose: () => void;
  onTeamClick: (name: string) => void;
  onPlayerClick: (name: string) => void;
}

type TabId = 'info' | 'stats' | 'events' | 'players';

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function statusLabel(status: string, minute: number | null) {
  const s = (status || '').toLowerCase();
  if (s === 'live') return minute != null ? `${minute}'` : 'LIVE';
  if (s === 'ht') return 'HT';
  if (s === 'ft' || s === 'finished') return 'FT';
  if (s === 'upcoming') return 'NS';
  return status?.toUpperCase() || '—';
}

function buildFallbackStats(match: ApiMatch): MatchStatRow[] {
  if (match.stats && match.stats.length) return match.stats;
  const events = match.events || [];
  const homeGoals = events.filter((e) => e.type === 'goal' && e.team === 'home').length;
  const awayGoals = events.filter((e) => e.type === 'goal' && e.team === 'away').length;
  const homeY = events.filter((e) => /yellow/i.test(e.type) && e.team === 'home').length;
  const awayY = events.filter((e) => /yellow/i.test(e.type) && e.team === 'away').length;
  const homeR = events.filter((e) => /red/i.test(e.type) && e.team === 'home').length;
  const awayR = events.filter((e) => /red/i.test(e.type) && e.team === 'away').length;
  return [
    { label: 'Goals', home: match.homeScore ?? homeGoals, away: match.awayScore ?? awayGoals },
    { label: 'Yellow cards', home: homeY, away: awayY },
    { label: 'Red cards', home: homeR, away: awayR },
    { label: 'Goal events logged', home: homeGoals, away: awayGoals },
  ];
}

function playersFromEvents(match: ApiMatch): MatchPlayerLine[] {
  if (match.players && match.players.length) return match.players;
  const map = new Map<string, MatchPlayerLine>();
  for (const e of match.events || []) {
    const key = `${e.team}:${e.player}`;
    const existing = map.get(key) || {
      name: e.player,
      team: (e.team === 'away' ? 'away' : 'home') as 'home' | 'away',
      events: [],
    };
    const tag =
      e.type === 'goal'
        ? `⚽ ${e.minute}'`
        : /yellow/i.test(e.type)
          ? `🟨 ${e.minute}'`
          : /red/i.test(e.type)
            ? `🟥 ${e.minute}'`
            : /sub/i.test(e.type)
              ? `🔄 ${e.minute}'`
              : `${e.type} ${e.minute}'`;
    existing.events = [...(existing.events || []), tag];
    if (e.assist) {
      const aKey = `${e.team}:${e.assist}`;
      const assistRow = map.get(aKey) || {
        name: e.assist,
        team: (e.team === 'away' ? 'away' : 'home') as 'home' | 'away',
        events: [],
      };
      assistRow.events = [...(assistRow.events || []), `🅰️ ${e.minute}'`];
      map.set(aKey, assistRow);
    }
    map.set(key, existing);
  }
  return Array.from(map.values());
}

export function MatchDetailModal({ match, onClose, onTeamClick, onPlayerClick }: MatchDetailModalProps) {
  const [tab, setTab] = useState<TabId>('info');
  const events = useMemo(
    () => [...(match.events || [])].sort((a, b) => a.minute - b.minute),
    [match.events],
  );
  const stats = useMemo(() => buildFallbackStats(match), [match]);
  const players = useMemo(() => playersFromEvents(match), [match]);
  const homePlayers = players.filter((p) => p.team === 'home');
  const awayPlayers = players.filter((p) => p.team === 'away');

  const tabs: { id: TabId; label: string; icon: typeof Info }[] = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'players', label: 'Players', icon: Users },
  ];

  const kickoff = match.kickoffAt
    ? new Date(match.kickoffAt).toLocaleString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Match details"
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0B1220] border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0B1220]/95 backdrop-blur px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  Full Time Result
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {match.league}
                  {match.country ? ` · ${match.country}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-slate-300" />
            </button>
          </div>

          {/* Scoreboard */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-white/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onTeamClick(match.homeTeam)}
                className="flex flex-1 flex-col items-center gap-2 min-w-0 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/15 text-sm font-bold text-white group-hover:border-amber-400/50">
                  {match.homeBadge ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={match.homeBadge} alt="" className="h-8 w-8 object-contain" />
                  ) : (
                    initials(match.homeTeam)
                  )}
                </div>
                <span className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">
                  {match.homeTeam}
                </span>
              </button>

              <div className="flex flex-col items-center px-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black tabular-nums text-white">
                    {match.homeScore ?? '—'}
                  </span>
                  <span className="text-lg text-slate-500 font-bold">-</span>
                  <span className="text-3xl font-black tabular-nums text-white">
                    {match.awayScore ?? '—'}
                  </span>
                </div>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {statusLabel(match.status, match.minute)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onTeamClick(match.awayTeam)}
                className="flex flex-1 flex-col items-center gap-2 min-w-0 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/15 text-sm font-bold text-white group-hover:border-amber-400/50">
                  {match.awayBadge ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={match.awayBadge} alt="" className="h-8 w-8 object-contain" />
                  ) : (
                    initials(match.awayTeam)
                  )}
                </div>
                <span className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">
                  {match.awayTeam}
                </span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex gap-1 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition',
                  tab === id
                    ? 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30'
                    : 'text-slate-400 hover:bg-white/5',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4 pb-8">
          {tab === 'info' && (
            <div className="space-y-3">
              <InfoRow icon={Trophy} label="Competition" value={match.league} />
              {match.country && <InfoRow icon={MapPin} label="Country" value={match.country} />}
              {match.venue && <InfoRow icon={MapPin} label="Venue" value={match.venue} />}
              {kickoff && <InfoRow icon={Clock} label="Kick-off" value={kickoff} />}
              <InfoRow
                icon={Goal}
                label="Result"
                value={`${match.homeTeam} ${match.homeScore ?? '—'} – ${match.awayScore ?? '—'} ${match.awayTeam}`}
              />
              {(match.coaches?.home || match.coaches?.away) && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" /> Coaches
                  </p>
                  {match.coaches?.home && (
                    <p className="text-sm text-slate-200">
                      <span className="text-slate-500">Home:</span> {match.coaches.home}
                    </p>
                  )}
                  {match.coaches?.away && (
                    <p className="text-sm text-slate-200">
                      <span className="text-slate-500">Away:</span> {match.coaches.away}
                    </p>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tap team badges for profiles. Open Stats / Events / Players for full breakdown.
              </p>
            </div>
          )}

          {tab === 'stats' && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
                Match statistics
              </p>
              {stats.map((row) => (
                <StatBar key={row.label} label={row.label} home={row.home} away={row.away} />
              ))}
              {!match.stats?.length && (
                <p className="text-[11px] text-slate-500 pt-2">
                  Detailed possession / shots appear when the sports provider sends full stats for this fixture.
                </p>
              )}
            </div>
          )}

          {tab === 'events' && (
            <div className="space-y-2">
              {events.length === 0 ? (
                <Empty icon={Clock} title="No events logged" body="Goals, cards and subs will show here when available." />
              ) : (
                events.map((e, i) => (
                  <button
                    key={`${e.minute}-${e.player}-${i}`}
                    type="button"
                    onClick={() => e.player && onPlayerClick(e.player)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-left hover:bg-white/5"
                  >
                    <span className="w-8 text-xs font-bold text-amber-400 tabular-nums">{e.minute}&apos;</span>
                    <span className="text-base">
                      {e.type === 'goal' ? '⚽' : /yellow/i.test(e.type) ? '🟨' : /red/i.test(e.type) ? '🟥' : /sub/i.test(e.type) ? '🔄' : '•'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{e.player || e.type}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {e.team === 'away' ? match.awayTeam : match.homeTeam}
                        {e.assist ? ` · Assist: ${e.assist}` : ''}
                        {e.detail ? ` · ${e.detail}` : ''}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {tab === 'players' && (
            <div className="grid grid-cols-2 gap-3">
              <PlayerColumn
                title={match.homeTeam}
                players={homePlayers}
                onPlayerClick={onPlayerClick}
              />
              <PlayerColumn
                title={match.awayTeam}
                players={awayPlayers}
                onPlayerClick={onPlayerClick}
              />
              {!players.length && (
                <div className="col-span-2">
                  <Empty
                    icon={Shirt}
                    title="No player events yet"
                    body="Scorers and carded players appear here from match events."
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Info;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
      <Icon className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
        <p className="text-sm text-white font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatBar({
  label,
  home,
  away,
}: {
  label: string;
  home: number | string;
  away: number | string;
}) {
  const h = typeof home === 'number' ? home : parseFloat(String(home)) || 0;
  const a = typeof away === 'number' ? away : parseFloat(String(away)) || 0;
  const total = h + a || 1;
  const hPct = Math.round((h / total) * 100);
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-bold tabular-nums text-white">{home}</span>
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold tabular-nums text-white">{away}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="bg-sky-500 transition-all" style={{ width: `${hPct}%` }} />
        <div className="bg-rose-500 transition-all" style={{ width: `${100 - hPct}%` }} />
      </div>
    </div>
  );
}

function PlayerColumn({
  title,
  players,
  onPlayerClick,
}: {
  title: string;
  players: MatchPlayerLine[];
  onPlayerClick: (name: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 truncate">
        {title}
      </p>
      <div className="space-y-1.5">
        {players.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => onPlayerClick(p.name)}
            className="w-full rounded-lg border border-white/5 bg-white/[0.03] px-2 py-2 text-left hover:bg-white/5"
          >
            <p className="text-xs font-semibold text-white truncate">{p.name}</p>
            {p.events && p.events.length > 0 && (
              <p className="text-[10px] text-slate-400 mt-0.5">{p.events.join(' · ')}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Empty({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Info;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <Icon className="h-8 w-8 text-slate-600 mb-2" />
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{body}</p>
    </div>
  );
}

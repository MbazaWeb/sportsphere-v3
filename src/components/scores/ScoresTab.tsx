'use client';
import React, { useState } from 'react';

import { useAppStore, type ScoresSubTab } from '@/store/useAppStore';
import { useUIStore } from '@/store/uiStore';
import { formatKickoffTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Trophy, ChevronDown, Globe, Flag, X, Crown } from 'lucide-react';
import { useEffect } from 'react';

// --- Filter definitions ----------------------------------------
const FILTERS = {
  sport:     ['All', 'Football', 'Basketball', 'Tennis', 'Cricket', 'Rugby', 'Boxing', 'MMA', 'F1', 'Athletics'],
  continent: ['All', 'Europe', 'Africa', 'South America', 'Asia', 'North America'],
  country:   ['All', 'England', 'Spain', 'Germany', 'France', 'Italy', 'Portugal', 'Netherlands', 'Africa'],
  tournament: ['All', 'Premier League', 'La Liga', 'Bundesliga', 'Ligue 1', 'Serie A', 'Champions League', 'Europa League', 'AFCON', 'World Cup'],
};

const SUBTABS: { id: ScoresSubTab; label: string }[] = [
  { id: 'live',      label: 'Live'      },
  { id: 'today',     label: 'Today'     },
  { id: 'upcoming',  label: 'Upcoming'  },
  { id: 'results',   label: 'Results'   },
  { id: 'standings', label: 'Standings' },
];

// --- API Match type ---
interface ApiMatch {
  id: string; league: string; homeTeam: string; awayTeam: string;
  homeScore: number | null; awayScore: number | null;
  status: string; minute: number | null; venue: string | null;
  kickoffAt: string; events: { minute: number; type: string; player: string; team: string }[];
  continent: string; country: string;
}

// --- Standing row type ---
interface StandingRow {
  pos: number; team: string; played: number; won: number; drawn: number;
  lost: number; gd: string; pts: number; handle?: string;
}

// --- Filter dropdown -------------------------------------------
function FilterDropdown({ label, options, value, onChange, icon: Icon }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; icon: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(o => !o);
  };

  return (
    <>
      <button ref={btnRef} onClick={handleOpen}
        className={cn('flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors border flex-shrink-0',
          value !== 'All' ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-surface border-surface-border text-muted-foreground hover:text-foreground')}>
        <Icon className="h-3 w-3" />
        {value === 'All' ? label : value.length > 10 ? value.slice(0, 10) + '…' : value}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 999 }}
              className="min-w-[160px] max-h-[60vh] overflow-y-auto rounded-xl bg-surface-elevated border border-surface-border shadow-2xl">
              {options.map((opt) => (
                <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                  className={cn('flex w-full items-center px-4 py-2.5 text-xs font-medium transition-colors hover:bg-surface text-left',
                    opt === value ? 'text-gold' : 'text-foreground')}>
                  {opt === value && <span className="mr-2 h-1.5 w-1.5 rounded-full bg-gold flex-shrink-0" />}
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Main Component --------------------------------------------
export default function ScoresTab() {
  const scoresSubTab    = useAppStore((s) => s.scoresSubTab);
  const setScoresSubTab = useAppStore((s) => s.setScoresSubTab);

  const [sport,      setSport]      = useState('All');
  const [continent,  setContinent]  = useState('All');
  const [country,    setCountry]    = useState('All');
  const [tournament, setTournament] = useState('All');

  const hasFilter = sport !== 'All' || continent !== 'All' || country !== 'All' || tournament !== 'All';

  const clearFilters = () => { setSport('All'); setContinent('All'); setCountry('All'); setTournament('All'); };

  const buildParams = () => {
    const params = new URLSearchParams();
    if (continent !== 'All') params.set('continent', continent);
    if (country !== 'All') params.set('country', country);
    if (tournament !== 'All') params.set('league', tournament);
    return params.toString();
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-black text-gold-gradient">Scores</h1>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
            <Search className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 pb-2">
          {SUBTABS.map((tab) => (
            <button key={tab.id} onClick={() => setScoresSubTab(tab.id)}
              className={cn('flex-shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors',
                scoresSubTab === tab.id ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
              {tab.label}
              {tab.id === 'live' && <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <FilterDropdown label="Sport"      options={FILTERS.sport}      value={sport}      onChange={setSport}      icon={Trophy} />
          <FilterDropdown label="Continent"  options={FILTERS.continent}  value={continent}  onChange={setContinent}  icon={Globe} />
          <FilterDropdown label="Country"    options={FILTERS.country}    value={country}    onChange={setCountry}    icon={Flag}  />
          <FilterDropdown label="Tournament" options={FILTERS.tournament} value={tournament} onChange={setTournament} icon={Trophy} />
          {hasFilter && (
            <button onClick={clearFilters} className="flex items-center gap-1 rounded-xl border border-surface-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </header>

      <motion.div key={scoresSubTab + sport + continent + country + tournament}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {scoresSubTab === 'live'      && <LiveContent queryParams={buildParams()} />}
        {scoresSubTab === 'today'     && <TodayContent queryParams={buildParams()} />}
        {scoresSubTab === 'upcoming'  && <UpcomingContent queryParams={buildParams()} />}
        {scoresSubTab === 'results'   && <ResultsContent queryParams={buildParams()} />}
        {scoresSubTab === 'standings' && <StandingsContent tournament={tournament} />}
      </motion.div>
    </div>
  );
}

// --- Empty state -----------------------------------------------
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Trophy className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">No {label} match current filters</p>
    </div>
  );
}

// --- Loading skeleton -------------------------------------------
function MatchSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
        <div className="h-2 w-20 rounded bg-surface animate-pulse" />
        <div className="h-2 w-8 rounded bg-surface animate-pulse" />
      </div>
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 text-right">
          <div className="h-3 w-16 rounded bg-surface animate-pulse ml-auto" />
        </div>
        <div className="mx-4 flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-surface animate-pulse" />
          <div className="h-6 w-6 rounded bg-surface animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="h-3 w-16 rounded bg-surface animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// --- TeamName — fetches from API then opens profile ---------------
function TeamName({ name, handle, align = 'left' }: { name: string; handle?: string | null; align?: 'left' | 'right' }) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  const handleClick = async () => {
    if (!handle) return;
    try {
      const res = await fetch(`/api/users?handle=${encodeURIComponent(handle)}`);
      if (res.ok) {
        const u = await res.json();
        const { apiUserToViewing } = await import('@/types');
        setViewingUser(apiUserToViewing(u, false));
      } else {
        // Fallback with basic data if not in DB yet
        setViewingUser({
          id: handle, name, handle,
          avatar: name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
          verified: false, coverGradient: 'from-red-800 to-red-900',
          bio: '', role: 'Team', location: '', joined: '',
          followers: 0, following: 0, posts: 0, isFollowing: false,
        });
      }
    } catch {
      // noop
    }
  };

  const cls = cn('text-sm font-semibold transition-colors', align === 'right' ? 'text-right' : 'text-left', handle ? 'text-white hover:text-gold cursor-pointer' : 'text-white');
  if (handle) return <button onClick={handleClick} className={cls}>{name}</button>;
  return <p className={cls}>{name}</p>;
}

// --- Live -----------------------------------------------------
function LiveContent({ queryParams }: { queryParams: string }) {
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const sep = queryParams ? '&' : '?';
        const res = await fetch(`/api/matches?status=live${queryParams ? '&' + queryParams : ''}`);
        if (res.ok) setMatches(await res.json());
      } catch (e) { /* empty */ }
      setLoading(false);
    }
    loadData();
  }, [queryParams]);

  if (loading) return <div className="p-4 flex flex-col gap-3"><MatchSkeleton /><MatchSkeleton /></div>;
  if (!matches.length) return <EmptyState label="live matches" />;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" />
        <span className="text-sm font-bold text-gold">{matches.length} live</span>
      </div>
      <div className="flex flex-col gap-3">
        {matches.map((m) => (
          <div key={m.id} className="glass-card rounded-2xl overflow-hidden glass-card-hover">
            <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">{m.league}</span>
              <div className="flex items-center gap-1.5">
                {m.status === 'live' && <><span className="flex h-1.5 w-1.5 rounded-full bg-gold animate-pulse" /><span className="text-[10px] font-bold text-gold">{m.minute}&apos;</span></>}
                {m.status === 'ht'   && <span className="text-[10px] font-bold text-yellow-400">HT</span>}
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex-1 text-right">
                <TeamName name={m.homeTeam} align="right" />
              </div>
              <div className="mx-4 flex items-center gap-3">
                <span className="text-2xl font-black text-gold tabular-nums">{m.homeScore}</span>
                <span className="text-muted-foreground">–</span>
                <span className="text-2xl font-black text-white tabular-nums">{m.awayScore}</span>
              </div>
              <div className="flex-1"><TeamName name={m.awayTeam} /></div>
            </div>
            {m.events.length > 0 && (
              <div className="border-t border-surface-border px-4 py-2 flex flex-col gap-0.5">
                {m.events.map((e, i) => <p key={i} className="text-xs text-gold font-medium">{e.player} {e.minute}&apos;</p>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Today ----------------------------------------------------
function TodayContent({ queryParams }: { queryParams: string }) {
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/matches?group=today${queryParams ? '&' + queryParams : ''}`);
        if (res.ok) setMatches(await res.json());
      } catch (e) { /* empty */ }
      setLoading(false);
    }
    loadData();
  }, [queryParams]);

  const formatTime = formatKickoffTime;

  if (loading) return <div className="p-4 flex flex-col gap-3"><MatchSkeleton /><MatchSkeleton /></div>;
  if (!matches.length) return <EmptyState label="today's fixtures match" />;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xs font-bold text-gold uppercase tracking-wider">Today&apos;s Fixtures</h2>
      <div className="flex flex-col gap-3">
        {matches.map((f) => (
          <div key={f.id} className="glass-card rounded-2xl overflow-hidden glass-card-hover">
            <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
              <span className="text-xs text-muted-foreground">{f.league}</span>
              <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-gold" /><span className="text-[10px] font-bold text-gold">{formatTime(f.kickoffAt)}</span></div>
            </div>
            <div className="flex items-center justify-between p-4">
              <p className="flex-1 text-right text-sm font-semibold text-white">{f.homeTeam}</p>
              <span className="mx-4 rounded-lg bg-gold/10 border border-gold/20 px-3 py-1 text-sm font-bold text-gold">VS</span>
              <p className="flex-1 text-sm font-semibold text-white">{f.awayTeam}</p>
            </div>
            <div className="border-t border-surface-border px-4 py-1.5">
              <p className="text-[10px] text-muted-foreground">📍 {f.venue}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Upcoming -------------------------------------------------
function UpcomingContent({ queryParams }: { queryParams: string }) {
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/matches?group=upcoming${queryParams ? '&' + queryParams : ''}`);
        if (res.ok) setMatches(await res.json());
      } catch (e) { /* empty */ }
      setLoading(false);
    }
    loadData();
  }, [queryParams]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    if (d.toDateString() === dayAfter.toDateString()) return 'Wed';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatTime = formatKickoffTime;

  if (loading) return <div className="p-4 flex flex-col gap-3"><MatchSkeleton /><MatchSkeleton /></div>;
  if (!matches.length) return <EmptyState label="upcoming fixtures match" />;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xs font-bold text-gold uppercase tracking-wider">Upcoming</h2>
      <div className="flex flex-col gap-3">
        {matches.map((f) => (
          <div key={f.id} className="glass-card rounded-2xl overflow-hidden glass-card-hover">
            <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
              <span className="text-xs text-muted-foreground">{f.league}</span>
              <span className="text-[10px] font-bold text-gold">{formatDate(f.kickoffAt)}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <p className="flex-1 text-right text-sm font-semibold text-white">{f.homeTeam}</p>
              <span className="mx-4 rounded-lg bg-gold/10 border border-gold/20 px-3 py-1 text-sm font-bold text-gold">{formatTime(f.kickoffAt)}</span>
              <p className="flex-1 text-sm font-semibold text-white">{f.awayTeam}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Results --------------------------------------------------
function ResultsContent({ queryParams }: { queryParams: string }) {
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/matches?group=results${queryParams ? '&' + queryParams : ''}`);
        if (res.ok) setMatches(await res.json());
      } catch (e) { /* empty */ }
      setLoading(false);
    }
    loadData();
  }, [queryParams]);

  if (loading) return <div className="p-4 flex flex-col gap-3"><MatchSkeleton /><MatchSkeleton /></div>;
  if (!matches.length) return <EmptyState label="results match" />;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xs font-bold text-gold uppercase tracking-wider">Finished</h2>
      <div className="flex flex-col gap-3">
        {matches.map((m) => (
          <div key={m.id} className="glass-card rounded-2xl overflow-hidden glass-card-hover">
            <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
              <span className="text-xs text-muted-foreground">{m.league}</span>
              <span className="text-[10px] font-bold text-muted-foreground">FT</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <p className="flex-1 text-right text-sm font-semibold text-white">{m.homeTeam}</p>
              <div className="mx-4 flex items-center gap-3">
                <span className={cn('text-2xl font-black tabular-nums', (m.homeScore ?? 0) > (m.awayScore ?? 0) ? 'text-gold' : 'text-white')}>{m.homeScore}</span>
                <span className="text-muted-foreground">–</span>
                <span className={cn('text-2xl font-black tabular-nums', (m.awayScore ?? 0) > (m.homeScore ?? 0) ? 'text-gold' : 'text-white')}>{m.awayScore}</span>
              </div>
              <p className="flex-1 text-sm font-semibold text-white">{m.awayTeam}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Standings ------------------------------------------------
function StandingsContent({ tournament }: { tournament: string }) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [activeTournament, setActiveTournament] = useState('Premier League');
  const [allStandings, setAllStandings] = useState<Record<string, StandingRow[]>>({});
  const [availableTournaments, setAvailableTournaments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/standings`);
        if (res.ok) {
          const data = await res.json();
          setAllStandings(data.standings);
          setAvailableTournaments(data.available);
        }
      } catch (e) { /* empty */ }
      setLoading(false);
    }
    loadData();
  }, []);

  const display = tournament !== 'All' && allStandings[tournament]
    ? tournament
    : activeTournament;

  const rows = allStandings[display] ?? allStandings['Premier League'] ?? [];

  const handleTeamClick = (row: StandingRow) => {
    if (row.handle) {
      setViewingUser({
        id: row.handle || row.team,
        name: row.team,
        handle: row.handle,
        avatar: row.team.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        verified: true,
        coverGradient: 'from-red-800 to-red-900',
        bio: '',
        role: 'Team',
        location: '',
        joined: '',
        followers: 0,
        following: 0,
        posts: 0,
        isFollowing: false,
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_3rem] items-center rounded-xl px-2 py-3 glass-card">
            <div className="h-3 w-3 rounded bg-surface animate-pulse" />
            <div className="h-3 w-24 rounded bg-surface animate-pulse" />
            <div className="h-3 w-3 rounded bg-surface animate-pulse" />
            <div className="h-3 w-3 rounded bg-surface animate-pulse" />
            <div className="h-3 w-3 rounded bg-surface animate-pulse" />
            <div className="h-3 w-4 rounded bg-surface animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Tournament selector */}
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {availableTournaments.map((t) => (
          <button key={t} onClick={() => setActiveTournament(t)}
            className={cn('flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              display === t ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
            {t}
          </button>
        ))}
      </div>

      {/* Standings Header */}
      <div className="mb-3 flex items-center gap-2">
        <Crown className="h-4 w-4 text-gold" />
        <span className="text-xs font-bold text-gold uppercase tracking-wider">{display} Standings</span>
      </div>

      <div className="mb-2 grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_3rem] items-center px-2 text-[10px] font-bold uppercase text-muted-foreground">
        <span>#</span><span>Team</span><span className="text-center">P</span><span className="text-center">W</span><span className="text-center">L</span><span className="text-right">Pts</span>
      </div>
      <div className="flex flex-col gap-1">
        {rows.map((row) => {
          const isChampion = row.pos === 1;
          const isTop4 = row.pos <= 4;
          return (
            <div key={row.pos} className={cn(
              'grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_3rem] items-center rounded-xl px-2 py-3 border transition-colors',
              isChampion ? 'bg-gold/10 border-gold/30' : 'glass-card border-surface-border'
            )}>
              <span className={cn('text-sm font-black', isChampion ? 'text-gold' : isTop4 ? 'text-gold/70' : 'text-muted-foreground')}>
                {row.pos}
              </span>
              {row.handle ? (
                <button onClick={() => handleTeamClick(row)}
                  className="truncate text-left text-sm font-semibold text-white hover:text-gold transition-colors">
                  {row.team}
                  {isChampion && <Crown className="ml-1 inline h-3 w-3 text-gold" />}
                </button>
              ) : (
                <span className="truncate text-sm font-semibold text-white">
                  {row.team}
                  {isChampion && <Crown className="ml-1 inline h-3 w-3 text-gold" />}
                </span>
              )}
              <span className="text-center text-xs text-muted-foreground">{row.played}</span>
              <span className="text-center text-xs text-muted-foreground">{row.won}</span>
              <span className="text-center text-xs text-muted-foreground">{row.lost}</span>
              <span className={cn('text-right text-sm font-black', isChampion ? 'text-gold' : 'text-white')}>{row.pts}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gold" /> Champion
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gold/40" /> Top 4
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-surface-border" /> Others
        </span>
      </div>
    </div>
  );
}

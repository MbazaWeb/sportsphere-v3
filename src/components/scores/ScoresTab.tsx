'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore, type ScoresSubTab } from '@/store/useAppStore';
import { useUIStore } from '@/store/uiStore';
import { formatKickoffTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Trophy, ChevronDown, Globe, Flag, X, Crown } from 'lucide-react';
import { useSports } from '@/hooks/useSports';

// --- Filter definitions
const FILTERS = {
  continent: ['All', 'Europe', 'Africa', 'South America', 'Asia', 'North America'],
  country: ['All', 'England', 'Spain', 'Germany', 'France', 'Italy', 'Portugal', 'Netherlands'],
  tournament: ['All', 'Premier League', 'La Liga', 'Bundesliga', 'Ligue 1', 'Serie A', 'Champions League', 'Europa League'],
};

const SUBTABS: { id: ScoresSubTab; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Results' },
  { id: 'standings', label: 'Standings' },
];

// --- Types
interface ApiMatch {
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
  events: { minute: number; type: string; player: string; team: string }[];
  continent: string;
  country: string;
}

interface StandingRow {
  pos: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: string;
  pts: number;
  handle?: string;
}

// --- Filter Dropdown Component
function FilterDropdown({
  label,
  options,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={cn(
          'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors border flex-shrink-0',
          value !== 'All'
            ? 'bg-gold/10 border-gold/30 text-gold'
            : 'bg-surface border-surface-border text-muted-foreground hover:text-foreground'
        )}
      >
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
              className="min-w-[160px] max-h-[60vh] overflow-y-auto rounded-xl bg-surface-elevated border border-surface-border shadow-2xl"
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center px-4 py-2.5 text-xs font-medium transition-colors hover:bg-surface text-left',
                    opt === value ? 'text-gold' : 'text-foreground'
                  )}
                >
                  {opt === value && (
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-gold flex-shrink-0" />
                  )}
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

// --- Empty State Component
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <p className="text-sm text-muted-foreground">No {label} at the moment</p>
    </div>
  );
}

// --- Main ScoresTab Component
export default function ScoresTab() {
  const scoresSubTab = useAppStore((s) => s.scoresSubTab);
  const setScoresSubTab = useAppStore((s) => s.setScoresSubTab);

  const [sport, setSport] = useState('All');
  const [continent, setContinent] = useState('All');
  const [country, setCountry] = useState('All');
  const [tournament, setTournament] = useState('All');

  const { sports } = useSports();
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const hasFilter = sport !== 'All' || continent !== 'All' || country !== 'All' || tournament !== 'All';

  // Fetch matches based on current tab
  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (sport !== 'All') params.append('sport', sport);
        if (scoresSubTab !== 'standings') params.append('status', scoresSubTab);
        if (continent !== 'All') params.append('continent', continent);
        if (country !== 'All') params.append('country', country);
        if (tournament !== 'All') params.append('tournament', tournament);

        const res = await fetch(`/api/matches?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMatches(Array.isArray(data) ? data : data.matches || []);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setLoading(false);
      }
    };

    if (scoresSubTab !== 'standings') {
      fetchMatches();
    }
  }, [scoresSubTab, sport, continent, country, tournament]);

  // Fetch standings
  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (tournament !== 'All') params.append('tournament', tournament);

        const res = await fetch(`/api/standings?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStandings(Array.isArray(data) ? data : data.standings || []);
        }
      } catch (error) {
        console.error('Failed to fetch standings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (scoresSubTab === 'standings') {
      fetchStandings();
    }
  }, [scoresSubTab, tournament]);

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h2 className="text-lg font-bold text-foreground">Scores</h2>
          <button className="rounded-full p-2 hover:bg-surface transition-colors">
            <Search className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 pb-2">
          {SUBTABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScoresSubTab(tab.id)}
              className={cn(
                'text-xs font-semibold px-3 py-1.5 rounded-full transition-all whitespace-nowrap',
                scoresSubTab === tab.id
                  ? 'bg-gold text-black'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {scoresSubTab !== 'standings' && (
          <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            <FilterDropdown
              label="Sport"
              options={['All', ...(sports?.map((s) => s.name) || [])]}
              value={sport}
              onChange={setSport}
              icon={Globe}
            />
            <FilterDropdown
              label="Continent"
              options={FILTERS.continent}
              value={continent}
              onChange={setContinent}
              icon={Globe}
            />
            <FilterDropdown
              label="Country"
              options={FILTERS.country}
              value={country}
              onChange={setCountry}
              icon={Flag}
            />
            <FilterDropdown
              label="Tournament"
              options={FILTERS.tournament}
              value={tournament}
              onChange={setTournament}
              icon={Trophy}
            />
          </div>
        )}
      </header>

      {/* Content */}
      <div className="divide-y divide-surface-border">
        {scoresSubTab === 'standings' ? (
          // Standings View
          <div className="p-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-surface rounded-lg animate-pulse" />
                ))}
              </div>
            ) : standings.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-[30px_1fr_40px_40px_40px_50px] gap-2 text-xs font-semibold text-muted-foreground px-2 py-1">
                  <span>#</span>
                  <span>Team</span>
                  <span className="text-center">P</span>
                  <span className="text-center">W</span>
                  <span className="text-center">L</span>
                  <span className="text-right">Pts</span>
                </div>
                {standings.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[30px_1fr_40px_40px_40px_50px] gap-2 items-center rounded-lg bg-surface p-2 hover:bg-surface-elevated transition-colors"
                  >
                    <span className="text-xs font-bold text-muted-foreground">{row.pos}</span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {row.team}
                      {idx === 0 && <Crown className="ml-1 inline h-3 w-3 text-gold" />}
                    </span>
                    <span className="text-center text-xs text-muted-foreground">{row.played}</span>
                    <span className="text-center text-xs text-muted-foreground">{row.won}</span>
                    <span className="text-center text-xs text-muted-foreground">{row.lost}</span>
                    <span className="text-right text-xs font-bold text-gold">{row.pts}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="standings" />
            )}
          </div>
        ) : // Matches View
        loading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface rounded-lg animate-pulse" />
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-2 p-4">
            {matches.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg bg-surface p-3 hover:bg-surface-elevated transition-colors"
              >
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{m.league}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{m.homeTeam}</p>
                    <div className="flex items-center gap-2 mx-3">
                      <span className="text-lg font-bold text-gold">
                        {m.status === 'live' && m.minute ? `${m.minute}'` : m.homeScore ?? '-'}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-lg font-bold text-gold">
                        {m.status === 'live' && m.minute ? m.minute : m.awayScore ?? '-'}
                      </span>
                    </div>
                    <p className="text-right text-sm font-semibold text-white">{m.awayTeam}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label={`${scoresSubTab} matches`} />
        )}
      </div>
    </div>
  );
}

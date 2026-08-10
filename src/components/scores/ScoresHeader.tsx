'use client';

import { useState, useEffect } from 'react';
import { Search, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { FilterDropdown } from './FilterDropdown';
import { useAppStore, type ScoresSubTab } from '@/store/useAppStore';

const SUBTABS: { id: ScoresSubTab; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Results' },
  { id: 'standings', label: 'Standings' },
];

const POPULAR_LEAGUES = [
  'All', 'English Premier League', 'Spanish La Liga', 'German Bundesliga',
  'Italian Serie A', 'French Ligue 1', 'UEFA Champions League',
  'UEFA Europa League', 'English Championship',
];

interface ScoresHeaderProps {
  sport: string;
  setSport: (v: string) => void;
  continent: string;
  setContinent: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  tournament: string;
  setTournament: (v: string) => void;
}

export function ScoresHeader({
  sport, setSport,
  continent, setContinent,
  country, setCountry,
  tournament, setTournament,
}: ScoresHeaderProps) {
  const scoresSubTab = useAppStore((s) => s.scoresSubTab);
  const setScoresSubTab = useAppStore((s) => s.setScoresSubTab);

  // Live match count indicator
  const [liveCount, setLiveCount] = useState<number | null>(null);

  useEffect(() => {
    if (scoresSubTab !== 'live') return;
    const fetchCount = async () => {
      try {
        const res = await apiFetch('/api/matches?status=live');
        if (res.ok) {
          const data = await res.json();
          setLiveCount(Array.isArray(data) ? data.length : 0);
        }
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [scoresSubTab]);

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4">
        <h2 className="text-lg font-bold text-foreground">Scores</h2>
        {liveCount !== null && liveCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-bold text-red-400">{liveCount} LIVE</span>
          </span>
        )}
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

      {/* League filter — for standings and match tabs */}
      <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        <FilterDropdown
          label="League"
          options={POPULAR_LEAGUES}
          value={tournament}
          onChange={(v) => { setTournament(v); if (v !== 'All') { setSport('All'); setContinent('All'); setCountry('All'); } }}
          icon={Trophy}
        />
      </div>
    </header>
  );
}

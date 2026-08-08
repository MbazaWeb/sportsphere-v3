'use client';

import { Search, Globe, Flag, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterDropdown } from './FilterDropdown';
import { useAppStore, type ScoresSubTab } from '@/store/useAppStore';

const SUBTABS: { id: ScoresSubTab; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Results' },
  { id: 'standings', label: 'Standings' },
];

const FILTERS = {
  continent: ['All', 'Europe', 'Africa', 'South America', 'Asia', 'North America'],
  country: ['All', 'England', 'Spain', 'Germany', 'France', 'Italy', 'Portugal', 'Netherlands'],
  tournament: ['All', 'Premier League', 'La Liga', 'Bundesliga', 'Ligue 1', 'Serie A', 'Champions League', 'Europa League'],
};

interface ScoresHeaderProps {
  sport: string;
  setSport: (v: string) => void;
  continent: string;
  setContinent: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  tournament: string;
  setTournament: (v: string) => void;
  sportsList: Array<{ name: string }> | undefined;
}

export function ScoresHeader({
  sport, setSport,
  continent, setContinent,
  country, setCountry,
  tournament, setTournament,
  sportsList
}: ScoresHeaderProps) {
  const scoresSubTab = useAppStore((s) => s.scoresSubTab);
  const setScoresSubTab = useAppStore((s) => s.setScoresSubTab);

  return (
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
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
          <FilterDropdown
            label="Sport"
            options={['All', ...(sportsList?.map((s) => s.name) || [])]}
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
  );
}

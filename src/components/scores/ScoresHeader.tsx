'use client';

import { useNavigationStore } from '@/store/navigationStore';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, RefreshCw, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
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

const DEFAULT_LEAGUES = [
  'All',
  // Football — Tanzania
  'Vodacom Premier League', 'NBC Premier League', 'Azam Sports Federation Cup',
  'Community Shield', 'Mapinduzi Cup', 'Union Cup', 'Zanzibar Premier League',
  // Basketball
  'National Basketball League',
  // Athletics
  'Kilimanjaro Marathon', 'Dar es Salaam Marathon',
  // Rugby
  'National Rugby League', 'National Rugby Sevens Series',
  // Volleyball
  'National Volleyball League',
  // Netball
  'National Netball League',
];

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDateLabel(d: Date): string {
  const today = new Date();
  today.setHours(0,0,0,0);
  const target = new Date(d);
  target.setHours(0,0,0,0);
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  const datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (diff === 0) return `Today · ${datePart}`;
  if (diff === 1) return `Tomorrow · ${datePart}`;
  if (diff === -1) return `Yesterday · ${datePart}`;

  return datePart;
}

interface ScoresHeaderProps {
  sport: string;
  setSport: (v: string) => void;
  continent: string;
  setContinent: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  tournament: string;
  setTournament: (v: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function ScoresHeader({
  sport, setSport,
  continent, setContinent,
  country, setCountry,
  tournament, setTournament,
  selectedDate, onDateChange,
}: ScoresHeaderProps) {
  const scoresSubTab = useAppStore((s) => s.scoresSubTab);
  const setScoresSubTab = useAppStore((s) => s.setScoresSubTab);

  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [leagues, setLeagues] = useState<string[]>(DEFAULT_LEAGUES);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());

  // Fetch live match count
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

  // Fetch available leagues
  useEffect(() => {
    const fetchLeagues = async () => {
      setLeaguesLoading(true);
      try {
        const res = await apiFetch('/api/standings');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.available) && data.available.length > 0) {
            setLeagues(['All', ...data.available]);
          }
        }
      } catch {
        // Keep default leagues on error
      } finally {
        setLeaguesLoading(false);
      }
    };
    fetchLeagues();
  }, []);

  // Navigate date
  const navigateDate = useCallback((direction: number) => {
    const current = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
    current.setDate(current.getDate() + direction);
    onDateChange(formatDate(current));
  }, [selectedDate, onDateChange]);

  // Go to today
  const goToToday = useCallback(() => {
    onDateChange(formatDate(new Date()));
  }, [onDateChange]);

  // Show date picker for today/upcoming/results
  const showDateControls = scoresSubTab === 'today' || scoresSubTab === 'upcoming' || scoresSubTab === 'results';
  const displayDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();

  // Date picker calendar helpers
  const pickerYear = pickerMonth.getFullYear();
  const pickerMonthIdx = pickerMonth.getMonth();
  const daysInMonth = new Date(pickerYear, pickerMonthIdx + 1, 0).getDate();
  const firstDayOfWeek = new Date(pickerYear, pickerMonthIdx, 1).getDay();
  const todayStr = formatDate(new Date());

  const handlePickerSelect = (day: number) => {
    const d = new Date(pickerYear, pickerMonthIdx, day);
    onDateChange(formatDate(d));
    setShowDatePicker(false);
  };

  return (
    <>
      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowDatePicker(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg rounded-t-3xl bg-surface-elevated border-t border-surface-border p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Picker header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setPickerMonth(new Date(pickerYear, pickerMonthIdx - 1, 1))}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              <span className="text-sm font-bold text-foreground">
                {pickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setPickerMonth(new Date(pickerYear, pickerMonthIdx + 1, 1))}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${pickerYear}-${String(pickerMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={day}
                    onClick={() => handlePickerSelect(day)}
                    className={cn(
                      'h-9 w-full rounded-xl text-sm font-medium transition-all duration-150',
                      isSelected && 'bg-gold text-black font-bold shadow-sm shadow-gold/30',
                      !isSelected && isToday && 'ring-1 ring-gold/50 text-gold',
                      !isSelected && !isToday && 'text-foreground hover:bg-surface',
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={goToToday}
                className="flex-1 rounded-xl bg-surface border border-surface-border py-2.5 text-xs font-bold text-foreground hover:bg-surface-elevated transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                className="flex-1 rounded-xl bg-gold/10 border border-gold/20 py-2.5 text-xs font-bold text-gold hover:bg-gold/20 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface-border/60 bg-background/80 backdrop-blur-2xl">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => useNavigationStore.getState().setActiveTab('home')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-surface-border bg-surface transition-colors hover:bg-surface-elevated active:scale-95"
              aria-label="Back to Home"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex flex-col min-w-0">
              <h2 className="truncate text-base sm:text-lg font-extrabold text-foreground tracking-tight leading-tight">Scores</h2>
              {selectedDate && (
                <span className="text-[10px] text-muted-foreground font-medium leading-tight">{formatDateLabel(displayDate)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {leaguesLoading && (
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
            )}
            {liveCount !== null && liveCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-extrabold text-red-400">{liveCount} LIVE</span>
              </span>
            )}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 pb-2">
          {SUBTABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScoresSubTab(tab.id)}
              className={cn(
                'text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap',
                scoresSubTab === tab.id
                  ? 'bg-gold text-black shadow-sm shadow-gold/20'
                  : 'text-muted-foreground hover:text-foreground active:scale-95'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date navigation (for upcoming/results) */}
        {showDateControls && (
          <div className="flex items-center gap-2 px-4 pb-2.5">
            <button
              onClick={() => navigateDate(-1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-elevated transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex-1 flex items-center justify-center gap-2 h-8 rounded-lg bg-surface hover:bg-surface-elevated transition-colors"
            >
              <Calendar className="h-3.5 w-3.5 text-gold" />
              <span className="text-xs font-bold text-foreground">{formatDateLabel(displayDate)}</span>
            </button>
            <button
              onClick={() => navigateDate(1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-elevated transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
            {selectedDate && selectedDate !== todayStr && (
              <button
                onClick={goToToday}
                className="h-8 px-2.5 flex items-center justify-center rounded-lg bg-gold/10 border border-gold/20 hover:bg-gold/20 transition-colors"
              >
                <span className="text-[10px] font-bold text-gold">Today</span>
              </button>
            )}
          </div>
        )}

        {/* League filter */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <FilterDropdown
            label="League"
            options={leagues}
            value={tournament}
            onChange={(v) => { setTournament(v); if (v !== 'All') { setSport('All'); setContinent('All'); setCountry('All'); } }}
            icon={Trophy}
          />
        </div>
      </header>
    </>
  );
}

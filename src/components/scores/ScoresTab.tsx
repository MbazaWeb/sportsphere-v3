'use client';

import { useAppStore, type ScoresSubTab } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Star, Clock, Trophy } from 'lucide-react';

const scoresSubTabs: { id: ScoresSubTab; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Results' },
  { id: 'standings', label: 'Standings' },
];

const liveMatches = [
  {
    id: 1,
    league: 'Premier League',
    homeTeam: 'Manchester United',
    awayTeam: 'Arsenal',
    homeScore: 2,
    awayScore: 1,
    minute: 78,
    status: 'live' as const,
    events: ['Rashford 23\'', 'Rashford 56\'', 'Saka 34\''],
  },
  {
    id: 2,
    league: 'La Liga',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeScore: 1,
    awayScore: 1,
    minute: 45,
    status: 'ht' as const,
    events: ['Vinicius 18\'', 'Lewandowski 38\''],
  },
  {
    id: 3,
    league: 'Serie A',
    homeTeam: 'Inter Milan',
    awayTeam: 'AC Milan',
    homeScore: 0,
    awayScore: 0,
    minute: 12,
    status: 'live' as const,
    events: [],
  },
];

const todayFixtures = [
  { id: 4, league: 'Premier League', homeTeam: 'Liverpool', awayTeam: 'Chelsea', time: '17:30', venue: 'Anfield' },
  { id: 5, league: 'Premier League', homeTeam: 'Tottenham', awayTeam: 'Newcastle', time: '20:00', venue: 'Tottenham Stadium' },
  { id: 6, league: 'Bundesliga', homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', time: '18:30', venue: 'Allianz Arena' },
  { id: 7, league: 'Ligue 1', homeTeam: 'PSG', awayTeam: 'Lyon', time: '21:00', venue: 'Parc des Princes' },
];

const upcomingFixtures = [
  { id: 8, league: 'Champions League', homeTeam: 'Man City', awayTeam: 'Napoli', date: 'Tomorrow', time: '21:00' },
  { id: 9, league: 'Champions League', homeTeam: 'Real Madrid', awayTeam: 'Inter Milan', date: 'Wed', time: '21:00' },
  { id: 10, league: 'Europa League', homeTeam: 'Arsenal', awayTeam: 'PSV', date: 'Thu', time: '20:00' },
  { id: 11, league: 'AFCON', homeTeam: 'Nigeria', awayTeam: 'Ghana', date: 'Sat', time: '17:00' },
  { id: 12, league: 'AFCON', homeTeam: 'Senegal', awayTeam: 'Egypt', date: 'Sat', time: '20:00' },
];

const results = [
  { id: 13, league: 'Premier League', homeTeam: 'Aston Villa', awayTeam: 'Brighton', homeScore: 3, awayScore: 1 },
  { id: 14, league: 'Premier League', homeTeam: 'West Ham', awayTeam: 'Wolves', homeScore: 2, awayScore: 0 },
  { id: 15, league: 'La Liga', homeTeam: 'Atletico Madrid', awayTeam: 'Sevilla', homeScore: 1, awayScore: 0 },
];

const standings = [
  { pos: 1, team: 'Manchester City', played: 15, won: 12, drawn: 2, lost: 1, gd: '+24', pts: 38 },
  { pos: 2, team: 'Arsenal', played: 15, won: 11, drawn: 3, lost: 1, gd: '+21', pts: 36 },
  { pos: 3, team: 'Liverpool', played: 15, won: 11, drawn: 2, lost: 2, gd: '+18', pts: 35 },
  { pos: 4, team: 'Aston Villa', played: 15, won: 9, drawn: 4, lost: 2, gd: '+12', pts: 31 },
  { pos: 5, team: 'Tottenham', played: 15, won: 9, drawn: 2, lost: 4, gd: '+8', pts: 29 },
  { pos: 6, team: 'Manchester United', played: 15, won: 8, drawn: 3, lost: 4, gd: '+6', pts: 27 },
  { pos: 7, team: 'Newcastle', played: 15, won: 7, drawn: 4, lost: 4, gd: '+5', pts: 25 },
  { pos: 8, team: 'Chelsea', played: 15, won: 7, drawn: 3, lost: 5, gd: '+3', pts: 24 },
];

export default function ScoresTab() {
  const scoresSubTab = useAppStore((s) => s.scoresSubTab);
  const setScoresSubTab = useAppStore((s) => s.setScoresSubTab);

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-white">Scores</h1>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated">
            <Search className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 pb-2">
          {scoresSubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScoresSubTab(tab.id)}
              className={cn(
                'flex-shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors',
                scoresSubTab === tab.id
                  ? 'bg-sport-green text-black'
                  : 'bg-surface text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.id === 'live' && (
                <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <motion.div
        key={scoresSubTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {scoresSubTab === 'live' && <LiveContent />}
        {scoresSubTab === 'today' && <TodayContent />}
        {scoresSubTab === 'upcoming' && <UpcomingContent />}
        {scoresSubTab === 'results' && <ResultsContent />}
        {scoresSubTab === 'standings' && <StandingsContent />}
      </motion.div>
    </div>
  );
}

function LiveContent() {
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-semibold text-red-400">3 matches live</span>
      </div>
      <div className="flex flex-col gap-3">
        {liveMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function TodayContent() {
  return (
    <div className="p-4">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Today&apos;s Fixtures</h2>
      <div className="flex flex-col gap-3">
        {todayFixtures.map((fixture) => (
          <FixtureCard key={fixture.id} fixture={fixture} />
        ))}
      </div>
    </div>
  );
}

function UpcomingContent() {
  return (
    <div className="p-4">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h2>
      <div className="flex flex-col gap-3">
        {upcomingFixtures.map((fixture) => (
          <UpcomingCard key={fixture.id} fixture={fixture} />
        ))}
      </div>
    </div>
  );
}

function ResultsContent() {
  return (
    <div className="p-4">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Finished</h2>
      <div className="flex flex-col gap-3">
        {results.map((match) => (
          <ResultCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function StandingsContent() {
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Premier League</h2>
        <div className="flex items-center gap-1 text-sport-green">
          <Trophy className="h-4 w-4" />
          <span className="text-xs font-semibold">24/25</span>
        </div>
      </div>

      {/* Headers */}
      <div className="mb-2 grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_3rem] items-center px-2 text-[10px] font-semibold uppercase text-muted-foreground">
        <span>#</span>
        <span>Team</span>
        <span>P</span>
        <span>W</span>
        <span>D</span>
        <span>L</span>
        <span className="text-right">Pts</span>
      </div>

      <div className="flex flex-col gap-1">
        {standings.map((row) => (
          <div
            key={row.pos}
            className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_3rem] items-center rounded-xl bg-surface-elevated border border-surface-border px-2 py-3"
          >
            <span className={cn(
              'text-sm font-bold',
              row.pos <= 4 ? 'text-sport-green' : 'text-muted-foreground'
            )}>
              {row.pos}
            </span>
            <span className="truncate text-sm font-semibold text-white">{row.team}</span>
            <span className="text-center text-xs text-muted-foreground">{row.played}</span>
            <span className="text-center text-xs text-muted-foreground">{row.won}</span>
            <span className="text-center text-xs text-muted-foreground">{row.drawn}</span>
            <span className="text-center text-xs text-muted-foreground">{row.lost}</span>
            <span className="text-right text-sm font-bold text-white">{row.pts}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sport-green" />
          <span className="text-[10px] text-muted-foreground">Champions League</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-[10px] text-muted-foreground">Europa League</span>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: typeof liveMatches[number] }) {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden">
      {/* League header */}
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">{match.league}</span>
        <div className="flex items-center gap-1.5">
          {match.status === 'live' && (
            <>
              <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase text-red-400">{match.minute}&apos;</span>
            </>
          )}
          {match.status === 'ht' && (
            <span className="text-[10px] font-bold uppercase text-yellow-400">HT</span>
          )}
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-white">{match.homeTeam}</p>
        </div>
        <div className="mx-4 flex items-center gap-3">
          <span className="text-2xl font-bold text-white tabular-nums">{match.homeScore}</span>
          <span className="text-lg text-muted-foreground">-</span>
          <span className="text-2xl font-bold text-white tabular-nums">{match.awayScore}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{match.awayTeam}</p>
        </div>
      </div>

      {/* Events */}
      {match.events.length > 0 && (
        <div className="border-t border-surface-border px-4 py-2">
          <div className="flex flex-col gap-1">
            {match.events.map((event, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                <span className="text-sport-green">{event}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FixtureCard({ fixture }: { fixture: typeof todayFixtures[number] }) {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">{fixture.league}</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground">{fixture.time}</span>
        </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-white">{fixture.homeTeam}</p>
          <p className="text-xs text-muted-foreground">{fixture.venue}</p>
        </div>
        <div className="mx-4 flex items-center">
          <span className="rounded-lg bg-surface px-3 py-1 text-sm font-bold text-muted-foreground">
            VS
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{fixture.awayTeam}</p>
        </div>
      </div>
    </div>
  );
}

function UpcomingCard({ fixture }: { fixture: typeof upcomingFixtures[number] }) {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">{fixture.league}</span>
        <span className="text-[10px] font-bold text-sport-green">{fixture.date}</span>
      </div>
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-white">{fixture.homeTeam}</p>
        </div>
        <div className="mx-4">
          <span className="rounded-lg bg-surface px-3 py-1 text-sm font-bold text-muted-foreground">
            {fixture.time}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{fixture.awayTeam}</p>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ match }: { match: typeof results[number] }) {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">{match.league}</span>
        <span className="text-[10px] font-bold text-muted-foreground">FT</span>
      </div>
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-white">{match.homeTeam}</p>
        </div>
        <div className="mx-4 flex items-center gap-3">
          <span className={cn(
            'text-2xl font-bold tabular-nums',
            match.homeScore > match.awayScore ? 'text-sport-green' : 'text-white'
          )}>
            {match.homeScore}
          </span>
          <span className="text-lg text-muted-foreground">-</span>
          <span className={cn(
            'text-2xl font-bold tabular-nums',
            match.awayScore > match.homeScore ? 'text-sport-green' : 'text-white'
          )}>
            {match.awayScore}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{match.awayTeam}</p>
        </div>
      </div>
    </div>
  );
}

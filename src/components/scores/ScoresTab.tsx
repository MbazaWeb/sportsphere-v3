'use client';
import { apiFetch } from '@/lib/api';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useSports } from '@/hooks/useSports';
import { ScoresHeader } from './ScoresHeader';
import { MatchList } from './MatchList';
import { StandingsList } from './StandingsList';

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

        const res = await apiFetch(`/api/matches?${params.toString()}`);
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
      // Auto-refresh every 30s on live tab
      if (scoresSubTab === 'live') {
        const interval = setInterval(fetchMatches, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [scoresSubTab, sport, continent, country, tournament]);

  // Fetch standings
  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (tournament !== 'All') params.append('tournament', tournament);

        const res = await apiFetch(`/api/standings?${params.toString()}`);
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

  const labelMap = {
    live: 'live matches',
    today: "today's matches",
    upcoming: 'upcoming matches',
    results: 'past results',
  };

  return (
    <div className="mx-auto max-w-lg">
      
      <ScoresHeader
        sport={sport} setSport={setSport}
        continent={continent} setContinent={setContinent}
        country={country} setCountry={setCountry}
        tournament={tournament} setTournament={setTournament}
        sportsList={sports}
      />

      <div className="divide-y divide-surface-border">
        {scoresSubTab === 'standings' ? (
          <StandingsList standings={standings} loading={loading} />
        ) : (
          <MatchList 
            matches={matches} 
            loading={loading} 
            label={labelMap[scoresSubTab] || 'matches'} 
          />
        )}
      </div>
    </div>
  );
}

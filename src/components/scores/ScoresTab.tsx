'use client';
import { apiFetch } from '@/lib/api';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ScoresHeader } from './ScoresHeader';
import { MatchList } from './MatchList';
import { StandingsList } from './StandingsList';

export default function ScoresTab() {
  const scoresSubTab = useAppStore((s) => s.scoresSubTab);

  const [tournament, setTournament] = useState('All');
  const [sport, setSport] = useState('All');
  const [continent, setContinent] = useState('All');
  const [country, setCountry] = useState('All');

  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch matches
  useEffect(() => {
    if (scoresSubTab === 'standings') return;

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ status: scoresSubTab });
        if (tournament !== 'All') params.append('league', tournament);

        const res = await apiFetch(`/api/matches?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMatches(Array.isArray(data) ? data : []);
        } else {
          setMatches([]);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();

    // Auto-refresh live every 30s
    if (scoresSubTab === 'live') {
      const interval = setInterval(fetchMatches, 30000);
      return () => clearInterval(interval);
    }
  }, [scoresSubTab, tournament]);

  // Fetch standings
  useEffect(() => {
    if (scoresSubTab !== 'standings') return;

    const fetchStandings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (tournament !== 'All') params.append('league', tournament);

        const res = await apiFetch(`/api/standings?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStandings(Array.isArray(data.standings) ? data.standings : []);
        } else {
          setStandings([]);
        }
      } catch (error) {
        console.error('Failed to fetch standings:', error);
        setStandings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
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
      />

      <div className="divide-y divide-surface-border">
        {scoresSubTab === 'standings' ? (
          <StandingsList
            standings={standings}
            loading={loading}
            league={tournament !== 'All' ? tournament : 'English Premier League'}
          />
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

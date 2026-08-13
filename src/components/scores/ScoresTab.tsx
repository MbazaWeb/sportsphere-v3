'use client';
import { apiFetch } from '@/lib/api';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ScoresHeader } from './ScoresHeader';
import { MatchList } from './MatchList';
import { MatchDetailModal } from '@/components/home/MatchDetailModal';
import { StandingsList } from './StandingsList';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export default function ScoresTab() {
  const scoresSubTab = useAppStore((s) => s.scoresSubTab);

  const [tournament, setTournament] = useState('All');
  const [sport, setSport] = useState('All');
  const [continent, setContinent] = useState('All');
  const [country, setCountry] = useState('All');
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  // Fetch matches
  useEffect(() => {
    if (scoresSubTab === 'standings') return;

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ status: scoresSubTab });
        if (tournament !== 'All') params.append('league', tournament);
        if ((scoresSubTab === 'upcoming' || scoresSubTab === 'results') && selectedDate) {
          params.append('date', selectedDate);
        }

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
  }, [scoresSubTab, tournament, selectedDate]);

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

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const labelMap = {
    live: 'live matches',
    today: "today's matches",
    upcoming: 'upcoming matches',
    results: 'past results',
  };

  return (
    <div>
      <ScoresHeader
        sport={sport} setSport={setSport}
        continent={continent} setContinent={setContinent}
        country={country} setCountry={setCountry}
        tournament={tournament} setTournament={setTournament}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
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
            onMatchClick={setSelectedMatch}
          />
        )}
      </div>
      {selectedMatch && (
        <MatchDetailModal
          match={{
            ...selectedMatch,
            venue: selectedMatch.venue ?? null,
            events: selectedMatch.events || [],
          }}
          onClose={() => setSelectedMatch(null)}
          onTeamClick={() => {}}
          onPlayerClick={() => {}}
        />
      )}
    </div>
  );
}
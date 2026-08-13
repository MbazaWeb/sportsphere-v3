'use client';

// ─── Team Fixtures & Results Tab ───────────────────────────────
//
// Fetches 5 upcoming + 5 recent results for this team from the
// matches API and renders them as match cards.

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Radio, Zap } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { getRoleProfile, rpString } from '../../shared/ui';
import { Card, SectionTitle, EmptyState, Badge } from '../../shared/ui';

interface MatchData {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: number | null;
  kickoffAt: string;
  venue?: string;
}

interface TeamMatches {
  live: MatchData[];
  upcoming: MatchData[];
  results: MatchData[];
}

function statusColor(status: string): 'green' | 'red' | 'gold' | 'blue' | 'muted' {
  if (status === 'live' || status === 'ht') return 'red';
  if (status === 'ft') return 'muted';
  return 'green';
}

function statusLabel(status: string, minute?: number | null): string {
  if (status === 'live') return minute ? `${minute}'` : 'LIVE';
  if (status === 'ht') return 'HT';
  if (status === 'ft') return 'FT';
  if (status === 'postponed') return 'PPD';
  return 'Upcoming';
}

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function isTeamWinner(m: MatchData, teamName: string): boolean {
  if (m.status !== 'ft' || m.homeScore == null || m.awayScore == null) return false;
  const isHome = m.homeTeam.toLowerCase().includes(teamName.toLowerCase());
  if (isHome) return m.homeScore > m.awayScore;
  return m.awayScore > m.homeScore;
}

function isTeamDraw(m: MatchData): boolean {
  return m.status === 'ft' && m.homeScore != null && m.homeScore === m.awayScore;
}

function MatchCardRow({ m, teamName }: { m: MatchData; teamName: string }) {
  const isHome = m.homeTeam.toLowerCase().includes(teamName.toLowerCase());
  const won = isTeamWinner(m, teamName);
  const draw = isTeamDraw(m);
  const lost = m.status === 'ft' && !won && !draw;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface p-3 border border-surface-border/40">
      {/* Date/time column */}
      <div className="flex-shrink-0 w-20 text-center">
        <p className="text-[10px] text-muted-foreground">{m.league ? m.league.split(' ').slice(0, 2).join(' ') : ''}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{m.venue || ''}</p>
      </div>

      {/* Teams + score */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-bold truncate ${isHome ? 'text-gold' : 'text-white'}`}>{m.homeTeam}</p>
          {(m.status === 'ft' || m.status === 'live' || m.status === 'ht') && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-sm font-black ${m.status === 'ft' && won ? 'text-emerald-400' : m.status === 'ft' && lost ? 'text-red-400' : 'text-white'}`}>
                {m.homeScore ?? '-'}
              </span>
              <span className="text-[10px] text-muted-foreground">:</span>
              <span className={`text-sm font-black ${m.status === 'ft' && !isHome && won ? 'text-emerald-400' : m.status === 'ft' && !isHome && lost ? 'text-red-400' : 'text-white'}`}>
                {m.awayScore ?? '-'}
              </span>
            </div>
          )}
          <p className={`text-sm font-bold truncate ${!isHome ? 'text-gold' : 'text-white'}`}>{m.awayTeam}</p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-muted-foreground">{formatKickoff(m.kickoffAt)}</p>
          <Badge color={statusColor(m.status)}>{statusLabel(m.status, m.minute)}</Badge>
        </div>
      </div>
    </div>
  );
}

export function TeamFixturesTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'team');
  const teamName = apiUser?.name || rpString(rp, 'nickname') || '';

  const [data, setData] = useState<TeamMatches | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamName) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/teams/matches?team=${encodeURIComponent(teamName)}&limit=5`);
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [teamName]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><div className="h-16 bg-surface animate-pulse rounded-lg" /></Card>
        ))}
      </div>
    );
  }

  const hasAny = data && (data.live.length > 0 || data.upcoming.length > 0 || data.results.length > 0);

  if (!hasAny) {
    return (
      <EmptyState
        icon={Calendar}
        title="No fixtures yet"
        message="When this team has scheduled or completed matches, they will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Live Matches */}
      {data!.live.length > 0 && (
        <Card hover>
          <SectionTitle icon={Radio}>Live Now</SectionTitle>
          <div className="flex flex-col gap-2">
            {data!.live.map(m => <MatchCardRow key={m.id} m={m} teamName={teamName} />)}
          </div>
        </Card>
      )}

      {/* Upcoming Fixtures */}
      {data!.upcoming.length > 0 && (
        <Card hover>
          <SectionTitle icon={Clock}>Upcoming Fixtures</SectionTitle>
          <div className="flex flex-col gap-2">
            {data!.upcoming.map(m => <MatchCardRow key={m.id} m={m} teamName={teamName} />)}
          </div>
        </Card>
      )}

      {/* Recent Results */}
      {data!.results.length > 0 && (
        <Card hover>
          <SectionTitle icon={Zap}>Recent Results</SectionTitle>
          <div className="flex flex-col gap-2">
            {data!.results.map(m => <MatchCardRow key={m.id} m={m} teamName={teamName} />)}
          </div>
        </Card>
      )}
    </div>
  );
}

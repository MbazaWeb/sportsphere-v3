'use client';
import { apiFetch } from '@/lib/api';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Sparkles, Heart, MessageCircle, Flame, ChevronDown, Shield, Crown as CrownIcon, Info, BarChart3, X, Trophy, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/store/useAppStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';
import { apiUserToViewing } from '@/types';
import { FeedCard } from './FeedCard';
import { CommentSheet } from './CommentSheet';
import { formatTime } from '@/lib/format';

// Types
interface ApiUser {
  id: string; name: string; handle: string; avatarUrl?: string | null; avatarInitials: string;
  isVerified: boolean; coverGradient: string; bio: string; role: string;
  location: string; followerCount: number; followingCount: number;
  postCount: number; registeredAt: string; verificationStatus: string;
}
interface ApiMatch {
  id: string; league: string; homeTeam: string; awayTeam: string;
  homeScore: number | null; awayScore: number | null;
  status: string; minute: number | null; venue: string | null;
  kickoffAt: string; events: { minute: number; type: string; player: string; team: string }[];
  continent: string; country: string;
}
interface ApiPost {
  id: string; userId: string; content: string; postType: string;
  mediaUrls: string[]; teamTag: string | null; playerTag: string | null;
  isBreaking: boolean; likeCount: number; commentCount: number;
  shareCount: number; viewCount: number; createdAt: string;
  poll?: {
    id: string; question: string; options: string[]; totalVotes: number;
    optionCounts?: number[];
    userVotedOption?: number | null;
    endsAt?: string | null;
  } | null;
  prediction?: {
    id: string; homeTeam: string; awayTeam: string;
    predictedHome: number | null; predictedAway: number | null;
    confidence: string | null; result?: string | null;
    isCorrect?: boolean | null;
  } | null;
  user: ApiUser;
}
interface ApiSpotlightItem {
  id: string; userId: string; content: string; postType: string;
  mediaUrls: string[]; likeCount: number; commentCount: number;
  viewCount: number; createdAt: string;
  user: ApiUser;
}

interface TeamFromMatch {
  name: string;
  league: string;
  matchCount: number;
  id?: string;
  handle?: string;
  avatarUrl?: string | null;
  avatarInitials?: string | null;
  isVerified?: boolean;
  isSeeded?: boolean;
}

interface StandingsTeam {
  pos: number;
  name: string;
  badge?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

interface SportlightsTabProps {
  onShare: (id: string) => void;
  onComment: (id: string) => void;
}

export function SportlightsTab({ onShare, onComment }: SportlightsTabProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [liveMatches, setLiveMatches] = useState<ApiMatch[]>([]);
  const [recentResults, setRecentResults] = useState<ApiMatch[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [teams, setTeams] = useState<TeamFromMatch[]>([]);
  const [seededTeams, setSeededTeams] = useState<TeamFromMatch[]>([]);
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; rank: number; name: string; handle: string; avatarUrl?: string | null; avatarInitials: string | null; points: number; isVerified: boolean; role: string }>>([]);
  const [spotlightItems, setSpotlightItems] = useState<ApiSpotlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchDetailOpen, setMatchDetailOpen] = useState(false);
  const [teamsDismissed, setTeamsDismissed] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ApiMatch | null>(null);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  // Auto-dismiss "Choose Your Teams" after 10 seconds
  useEffect(() => {
    const t = setTimeout(() => setTeamsDismissed(true), 10000);
    return () => clearTimeout(t);
  }, []);

  // Fetch real PL standings from football-data.org
  useEffect(() => {
    setStandingsLoading(true);
    apiFetch('/api/standings?league=English%20Premier%20League')
      .then(res => { if (res.ok) return res.json(); return null; })
      .then(data => {
        if (data && Array.isArray(data.standings)) {
          setStandings(data.standings.map((s: any) => ({
            pos: s.pos,
            name: s.team,
            badge: s.badge || undefined,
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            gf: s.gf,
            ga: s.ga,
            gd: s.gd,
            pts: s.pts,
          })));
        }
        setStandingsLoading(false);
      })
      .catch(() => setStandingsLoading(false));
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [matchesRes, feedRes, usersRes, leaderboardRes, spotlightRes, resultsRes] = await Promise.all([
        apiFetch('/api/matches?status=live'),
        apiFetch('/api/feed?type=for-you'),
        apiFetch('/api/users'),
        apiFetch('/api/leaderboard'),
        apiFetch('/api/spotlight'),
        apiFetch('/api/matches?status=results'),
      ]);
      if (matchesRes.ok) setLiveMatches(await matchesRes.json());
      if (feedRes.ok) setPosts(await feedRes.json());
      if (usersRes.ok) {
        const allUsers = await usersRes.json();
        // Extract team accounts for Choose Your Teams
        const teamAccounts = allUsers
          .filter((u: { role: string }) => u.role === 'team')
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            league: (u.roleData && typeof u.roleData === 'object' ? u.roleData.league : null) || u.roleProfile?.league || 'Premier League',
            matchCount: 0,
            handle: u.handle,
            avatarUrl: u.avatarUrl,
            avatarInitials: u.avatarInitials,
            isVerified: u.isVerified,
            isSeeded: true,
          }))
          .sort((a: TeamFromMatch, b: TeamFromMatch) => a.name.localeCompare(b.name));
        setSeededTeams(teamAccounts);
        setLeaderboard(allUsers
          .sort((a: { followerCount: number }, b: { followerCount: number }) => (b.followerCount || 0) - (a.followerCount || 0))
          .slice(0, 10)
          .map((u: any, i: number) => ({
            rank: i + 1,
            id: u.id,
            name: u.name,
            handle: u.handle,
            avatarUrl: u.avatarUrl,
            avatarInitials: u.avatarInitials,
            points: u.followerCount || 0,
            isVerified: u.isVerified,
            role: u.role,
          })));
      }
      if (leaderboardRes.ok) {
        const lbData = await leaderboardRes.json();
        if (Array.isArray(lbData) && lbData.length > 0) {
          setLeaderboard(lbData.slice(0, 10));
        }
      }
      if (spotlightRes.ok) setSpotlightItems(await spotlightRes.json());
      if (resultsRes.ok) {
        const results = await resultsRes.json();
        const resultsArr = Array.isArray(results) ? results : [];
        setRecentResults(resultsArr.slice(0, 8));
      }
    } catch (e) { console.error('Feed load error', e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Build teams list: seeded team accounts + teams from live/recent matches
  useEffect(() => {
    const teamMap = new Map<string, TeamFromMatch>();
    // Start with seeded team accounts (from DB)
    seededTeams.forEach((t) => {
      teamMap.set(t.name.toLowerCase(), t);
    });
    // Merge in teams from match data (add matchCount)
    const allMatches = [...liveMatches, ...recentResults];
    allMatches.forEach((m) => {
      [m.homeTeam, m.awayTeam].forEach((teamName) => {
        if (!teamName) return;
        const key = teamName.toLowerCase();
        const existing = teamMap.get(key);
        if (existing) {
          existing.matchCount++;
        } else {
          teamMap.set(key, { name: teamName, league: m.league, matchCount: 1 });
        }
      });
    });
    const sorted = Array.from(teamMap.values())
      .sort((a, b) => {
        // Seeded teams first, then by match count, then alphabetical
        if (a.isSeeded && !b.isSeeded) return -1;
        if (!a.isSeeded && b.isSeeded) return 1;
        return b.matchCount - a.matchCount || a.name.localeCompare(b.name);
      })
      .slice(0, 20);
    setTeams(sorted);
  }, [liveMatches, recentResults, seededTeams]);

  // Standings now come from /api/standings (football-data.org)
  // The old local computation from results is removed in favor of real API data

  const openTeamByName = async (teamName: string) => {
    const handleGuess = '@' + teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
    try {
      const res = await apiFetch('/api/users?handle=' + encodeURIComponent(handleGuess));
      if (res.ok) { const u = await res.json(); setViewingUser(apiUserToViewing(u, false)); return; }
    } catch { /* noop */ }
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) {
        const all = await res.json();
        const match = all.find((u: { name: string; role: string }) => u.role === 'team' && u.name.toLowerCase() === teamName.toLowerCase());
        if (match) setViewingUser(apiUserToViewing(match, false));
      }
    } catch { /* noop */ }
  };

  const featuredMatch = liveMatches[0];
  const bigResult = recentResults[0];

  return (
    <div className="min-h-screen">
    <div className="flex flex-col gap-4 p-4">

      {/* ===== FEATURED LIVE MATCH ===== */}
      {featuredMatch && (
        <div className="premium-glow-border">
          <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-emerald-700 via-green-800 to-emerald-900">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="relative flex items-center justify-between p-3">
              <div className="flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{'Live \u00b7 '}{featuredMatch.minute}&apos;</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setMatchDetailOpen(true); }} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors">
                <Info className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <div className="relative px-4 pb-2">
              <p className="text-[10px] font-bold uppercase text-white/70 tracking-wider">{featuredMatch.league}</p>
            </div>
            <div className="relative px-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => openTeamByName(featuredMatch.homeTeam)} className="flex flex-col items-center gap-1.5 flex-1 group">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 border-2 border-white/20 text-lg font-black text-white group-hover:border-gold group-hover:scale-105 transition-all">
                    {featuredMatch.homeTeam.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white text-center leading-tight group-hover:text-gold transition-colors">{featuredMatch.homeTeam}</p>
                </button>
                <button onClick={() => setMatchDetailOpen(true)} className="flex flex-col items-center group">
                  <p className="text-4xl font-black text-white">
                    {featuredMatch.homeScore} <span className="text-white/40 mx-1">-</span> {featuredMatch.awayScore}
                  </p>
                  <p className="text-[10px] text-white/60 mt-1 group-hover:text-gold transition-colors flex items-center gap-1">
                    <Info className="h-2.5 w-2.5" /> Tap for stats
                  </p>
                </button>
                <button onClick={() => openTeamByName(featuredMatch.awayTeam)} className="flex flex-col items-center gap-1.5 flex-1 group">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 border-2 border-white/20 text-lg font-black text-white group-hover:border-gold group-hover:scale-105 transition-all">
                    {featuredMatch.awayTeam.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white text-center leading-tight group-hover:text-gold transition-colors">{featuredMatch.awayTeam}</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {matchDetailOpen && featuredMatch && (
        <MatchDetailModal match={featuredMatch} onClose={() => setMatchDetailOpen(false)} onTeamClick={openTeamByName} onPlayerClick={() => {}} />
      )}

      {/* ===== BIG MATCH RESULT ===== */}
      {bigResult && (
        <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] border border-gold/20 shadow-lg shadow-gold/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold" />
                <span className="text-[10px] font-bold uppercase text-gold tracking-wider">Full Time Result</span>
              </div>
              <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">{bigResult.league}</span>
            </div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border-2 border-gold/30 text-sm font-black text-white">
                  {bigResult.homeTeam.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-[11px] font-bold text-white text-center leading-tight">{bigResult.homeTeam}</p>
              </div>
              <div className="text-center px-3">
                <p className="text-3xl font-black text-white tracking-tight">
                  {bigResult.homeScore ?? '-'} <span className="text-white/30 mx-1">-</span> {bigResult.awayScore ?? '-'}
                </p>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold/10 border border-gold/20 px-2.5 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase">FT</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border-2 border-gold/30 text-sm font-black text-white">
                  {bigResult.awayTeam.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-[11px] font-bold text-white text-center leading-tight">{bigResult.awayTeam}</p>
              </div>
            </div>
            {bigResult.events && bigResult.events.length > 0 && (
              <div className="border-t border-white/10 pt-2.5 mt-1">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {bigResult.events
                    .filter((e: { type: string }) => e.type === 'goal')
                    .slice(0, 6)
                    .map((e: { minute: number; player: string; team: string }, i: number) => (
                      <span key={i} className="text-[10px] text-white/60">
                        <span className="text-gold font-bold">{e.minute}&apos;</span> {e.player}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MORE RECENT RESULTS ===== */}
      {recentResults.length > 1 && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gold" />
            <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Recent Results</h3>
            <span className="text-[10px] text-muted-foreground ml-auto">{recentResults.length - 1} matches</span>
          </div>
          <div className="flex flex-col gap-2">
            {recentResults.slice(1, 7).map((m, i) => (
              <div
                key={m.id || i}
                className="flex items-center gap-2 rounded-xl bg-surface/50 border border-surface-border/50 px-3 py-2.5 cursor-pointer hover:bg-surface hover:border-gold/20 transition-all"
                onClick={() => { setSelectedResult(m); }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{m.homeTeam}</span>
                  <span className="text-sm font-black text-gold flex-shrink-0">
                    {m.homeScore ?? '-'} - {m.awayScore ?? '-'}
                  </span>
                  <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{m.awayTeam}</span>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5">
                    <span className="text-[8px] font-bold text-emerald-400 uppercase">FT</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedResult && (
        <MatchDetailModal match={selectedResult} onClose={() => setSelectedResult(null)} onTeamClick={openTeamByName} onPlayerClick={() => {}} />
      )}

      {/* ===== STANDINGS TABLE (from match results) ===== */}
      {standings.length > 0 && (
        <div className="glass-card rounded-2xl p-4 glass-card-hover">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-gold" />
            <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Standings</h3>
            <span className="text-[10px] text-muted-foreground ml-auto">{standings.length} teams</span>
          </div>
          <div className="overflow-x-auto scrollbar-hide -mx-1">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-muted-foreground uppercase tracking-wider border-b border-surface-border/50">
                  <th className="py-1.5 pr-1 text-left w-5">#</th>
                  <th className="py-1.5 pr-1 text-left">Team</th>
                  <th className="py-1.5 px-1 text-center w-6">P</th>
                  <th className="py-1.5 px-1 text-center w-6">W</th>
                  <th className="py-1.5 px-1 text-center w-6">D</th>
                  <th className="py-1.5 px-1 text-center w-6">L</th>
                  <th className="py-1.5 px-1 text-center w-8">GD</th>
                  <th className="py-1.5 pl-1 text-right w-7 font-bold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 20).map((team) => {
                  const posColor = team.pos <= 4 ? 'text-emerald-400' : team.pos <= 6 ? 'text-blue-400' : team.pos >= 18 ? 'text-red-400' : 'text-white';
                  return (
                    <tr key={team.pos} className="border-b border-surface-border/20 hover:bg-surface/50 cursor-pointer" onClick={() => openTeamByName(team.name)}>
                      <td className={cn('py-1.5 pr-1 font-bold', posColor)}>{team.pos}</td>
                      <td className="py-1.5 pr-1">
                        <div className="flex items-center gap-1.5">
                          {team.badge ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={team.badge} alt="" className="h-4 w-4 object-contain flex-shrink-0" />
                          ) : (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gold/10 text-[7px] font-bold text-gold flex-shrink-0">
                              {team.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[10px] font-semibold text-white truncate max-w-[72px]">{team.name}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-1 text-center text-white/70">{team.played}</td>
                      <td className="py-1.5 px-1 text-center text-emerald-400 font-bold">{team.won}</td>
                      <td className="py-1.5 px-1 text-center text-yellow-400 font-bold">{team.drawn}</td>
                      <td className="py-1.5 px-1 text-center text-red-400 font-bold">{team.lost}</td>
                      <td className="py-1.5 px-1 text-center text-white/70">{team.gd > 0 ? '+' : ''}{team.gd}</td>
                      <td className="py-1.5 pl-1 text-right text-gold font-black">{team.pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TOP ACCOUNTS ===== */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Top Accounts</h3>
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No leaderboard data yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={async () => {
                  try {
                    const res = await apiFetch('/api/users?handle=' + encodeURIComponent(item.handle));
                    if (res.ok) { const u = await res.json(); setViewingUser(apiUserToViewing(u, false)); }
                  } catch { /* noop */ }
                }}
                className="flex items-center gap-3 rounded-xl bg-surface p-2.5 text-left hover:bg-surface-elevated transition-colors w-full"
              >
                <span className={cn('w-5 text-center text-sm font-black', item.rank === 1 ? 'text-gold' : item.rank === 2 ? 'text-gray-300' : item.rank === 3 ? 'text-orange-400' : 'text-muted-foreground')}>
                  {item.rank}
                </span>
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gold/10 text-xs font-bold text-gold flex-shrink-0">
                  {item.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.avatarUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    item.avatarInitials || item.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{item.role}</p>
                </div>
                <span className="text-sm font-bold text-gold">{formatCount(item.points)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== CHOOSE YOUR TEAMS (seeded accounts + match data) ===== */}
      {!teamsDismissed && (
      <div className="glass-card rounded-2xl p-4 glass-card-hover relative">
        <button
          onClick={() => setTeamsDismissed(true)}
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated z-10"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Choose Your Teams</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">{teams.length} teams</span>
        </div>
        {teams.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No teams available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <button
                key={team.id || team.name}
                onClick={() => {
                  if (team.handle) {
                    apiFetch('/api/users?handle=' + encodeURIComponent(team.handle)).then(res => {
                      if (res.ok) res.json().then(u => setViewingUser(apiUserToViewing(u, false)));
                    });
                  } else {
                    openTeamByName(team.name);
                  }
                }}
                className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-surface border border-surface-border px-3 py-2 hover:border-gold/30 hover:bg-surface-elevated transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/10 text-[10px] font-bold text-gold flex-shrink-0">
                  {team.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={team.avatarUrl} alt={team.name} className="h-full w-full object-cover rounded-full" />
                  ) : (
                    team.avatarInitials || team.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[11px] font-semibold text-white leading-tight">{team.name}</span>
                  <span className="text-[9px] text-muted-foreground">{team.league}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {/* ===== FEED POSTS ===== */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No posts yet</p>
        </div>
      ) : (
        posts.map((item) => <FeedCard key={item.id} item={item} onShare={onShare} onComment={onComment} formatTime={formatTime} />)
      )}

      {/* ===== SPOTLIGHT VIDEOS ===== */}
      {spotlightItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 mt-2">
            <Zap className="h-4 w-4 text-gold" />
            <p className="text-sm font-bold text-white">Spotlight Videos</p>
          </div>
          <div className="flex flex-col gap-3">
            {spotlightItems.map((item) => (
              <div key={item.id} className="bg-[#1e2126] rounded-2xl p-4 mb-3 border border-surface-border">
                <div className="mb-3"><p className="text-white text-sm font-medium">{item.content}</p></div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                  {item.mediaUrls && item.mediaUrls.length > 0 ? (
                    (item.postType === 'video' || item.postType === 'spotlight') ? (
                      <video src={item.mediaUrls[0]} className="w-full h-full object-cover" controls playsInline preload="metadata" />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.mediaUrls[0]} alt={item.content || ''} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="h-full bg-gradient-to-br from-emerald-700 to-green-900 flex items-center justify-center">
                      <Zap className="h-12 w-12 text-white/30" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-surface-border/50">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Heart className="h-3 w-3" />{formatCount(item.likeCount)}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><MessageCircle className="h-3 w-3" />{formatCount(item.commentCount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-surface animate-pulse" />\n          <div className="flex-1"><div className="h-3 w-24 rounded bg-surface animate-pulse mb-1" /><div className="h-2 w-16 rounded bg-surface animate-pulse" /></div>
        </div>
        <div className="h-3 w-full rounded bg-surface animate-pulse mb-2" /><div className="h-3 w-3/4 rounded bg-surface animate-pulse" />
        <div className="flex items-center justify-between border-t border-surface-border pt-3 mt-3">
          <div className="flex gap-4"><div className="h-3 w-8 rounded bg-surface animate-pulse" /><div className="h-3 w-8 rounded bg-surface animate-pulse" /><div className="h-3 w-8 rounded bg-surface animate-pulse" /></div>
        </div>
      </div>
    </div>
  );
}

function MatchDetailModal({ match, onClose, onTeamClick, onPlayerClick }: {
  match: ApiMatch;
  onClose: () => void;
  onTeamClick: (name: string) => void;
  onPlayerClick: (name: string) => void;
}) {
  const events = (match.events || []) as Array<{ minute: number; type: string; player: string; team: string }>;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface-elevated border border-surface-border"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface-elevated px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-bold text-white">Match Details</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="premium-glow-border">
            <div className="rounded-[14px] bg-gradient-to-br from-emerald-700 to-green-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-white/70 tracking-wider">{match.league}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', match.status === 'live' ? 'bg-red-500 text-white' : 'bg-surface text-muted-foreground')}>
                  {match.status === 'live' ? ('Live ' + match.minute + "'") : 'Full Time'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => onTeamClick(match.homeTeam)} className="flex flex-col items-center gap-1 flex-1 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-sm font-black text-white group-hover:border-gold transition-colors">
                    {match.homeTeam.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white text-center group-hover:text-gold">{match.homeTeam}</p>
                </button>
                <div className="text-center">
                  <p className="text-3xl font-black text-white">{match.homeScore} - {match.awayScore}</p>
                </div>
                <button onClick={() => onTeamClick(match.awayTeam)} className="flex flex-col items-center gap-1 flex-1 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-sm font-black text-white group-hover:border-gold transition-colors">
                    {match.awayTeam.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white text-center group-hover:text-gold">{match.awayTeam}</p>
                </button>
              </div>
            </div>
          </div>
          {events.length > 0 && (
            <div className="glass-card rounded-xl p-3">
              <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-2">Match Events</h4>
              <div className="flex flex-col gap-1.5">
                {events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{e.minute}&apos;</span>
                    <span className={cn('text-[10px] font-bold uppercase w-12', e.team === 'home' ? 'text-emerald-400' : 'text-blue-400')}>{e.team === 'home' ? match.homeTeam.slice(0, 3) : match.awayTeam.slice(0, 3)}</span>
                    <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold uppercase', e.type === 'goal' ? 'bg-gold/20 text-gold' : e.type === 'red_card' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400')}>
                      {e.type === 'goal' ? '\u26bd' : e.type === 'red_card' ? '\ud83d\uddf5' : '\ud83d\udfe8'} {e.player}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface border border-surface-border p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Venue</p>
              <p className="text-sm font-semibold text-white">{match.venue || 'TBD'}</p>
            </div>
            <div className="rounded-xl bg-surface border border-surface-border p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Kick-off</p>
              <p className="text-sm font-semibold text-white">{new Date(match.kickoffAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
import { apiFetch } from '@/lib/api';
﻿'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Sparkles, Heart, MessageCircle, Flame, ChevronDown, Shield, Crown as CrownIcon, Info, BarChart3, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/store/useAppStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';
import { apiUserToViewing } from '@/types';
import { FeedCard } from './FeedCard';
import { CommentSheet } from './CommentSheet';
import { formatTime } from '@/lib/format';
import PullToRefresh from '@/components/layout/PullToRefresh';

// Types
interface ApiUser {
  id: string; name: string; handle: string; avatarInitials: string;
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
  poll?: { id: string; question: string; options: string[]; totalVotes: number } | null;
  user: ApiUser;
}
interface ApiSpotlightItem {
  id: string; userId: string; content: string; postType: string;
  mediaUrls: string[]; likeCount: number; commentCount: number;
  viewCount: number; createdAt: string;
  user: ApiUser;
}

interface SportlightsTabProps {
  onShare: (id: string) => void;
  onComment: (id: string) => void;
}

export function SportlightsTab({ onShare, onComment }: SportlightsTabProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [liveMatches, setLiveMatches] = useState<ApiMatch[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; handle: string; avatarInitials: string | null; coverGradient: string }>>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; rank: number; name: string; handle: string; avatarInitials: string | null; points: number; isVerified: boolean; role: string }>>([]);
  const [spotlightItems, setSpotlightItems] = useState<ApiSpotlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  const loadData = useCallback(async () => {
    try {
      const [matchesRes, feedRes, usersRes, leaderboardRes, spotlightRes] = await Promise.all([
        apiFetch('/api/matches?status=live'),
        apiFetch('/api/feed?type=for-you'),
        apiFetch('/api/users'),
        apiFetch('/api/leaderboard'),
        apiFetch('/api/spotlight'),
      ]);
      if (matchesRes.ok) setLiveMatches(await matchesRes.json());
      if (feedRes.ok) setPosts(await feedRes.json());
      if (usersRes.ok) {
        const allUsers = await usersRes.json();
        setTeams(allUsers.filter((u: { role: string }) => u.role === 'team').slice(0, 10));
      }
      if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
      if (spotlightRes.ok) setSpotlightItems(await spotlightRes.json());
    } catch (e) { }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openTeamByName = async (teamName: string) => {
    const handleGuess = '@' + teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
    try {
      const res = await apiFetch(`/api/users?handle=${encodeURIComponent(handleGuess)}`);
      if (res.ok) {
        const u = await res.json();
        setViewingUser(apiUserToViewing(u, false));
        return;
      }
    } catch { }
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) {
        const all = await res.json();
        const match = all.find((u: { name: string; role: string }) =>
          u.role === 'team' && u.name.toLowerCase() === teamName.toLowerCase()
        );
        if (match) setViewingUser(apiUserToViewing(match, false));
      }
    } catch { }
  };

  const openPlayerByName = async (playerName: string) => {
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) {
        const all = await res.json();
        const match = all.find((u: { name: string; role: string }) =>
          u.role === 'player' && (
            u.name.toLowerCase().includes(playerName.toLowerCase()) ||
            playerName.toLowerCase().includes(u.name.toLowerCase().split(' ')[0])
          )
        );
        if (match) setViewingUser(apiUserToViewing(match, false));
      }
    } catch { }
  };

  const openTeamByHandle = async (handle: string) => {
    try {
      const res = await apiFetch(`/api/users?handle=${encodeURIComponent(handle)}`);
      if (res.ok) {
        const u = await res.json();
        setViewingUser(apiUserToViewing(u, false));
      }
    } catch { }
  };

  const featuredMatch = liveMatches[0];
  const [matchDetailOpen, setMatchDetailOpen] = useState(false);

  return (
    <PullToRefresh onRefresh={loadData} className="min-h-screen">
    <div className="flex flex-col gap-4 p-4">
      {featuredMatch && (
        <div className="premium-glow-border">
          <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-emerald-700 via-green-800 to-emerald-900">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="relative flex items-center justify-between p-3">
              <div className="flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live · {featuredMatch.minute}&apos;</span>
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
        <MatchDetailModal match={featuredMatch} onClose={() => setMatchDetailOpen(false)} onTeamClick={openTeamByName} onPlayerClick={openPlayerByName} />
      )}

      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Top Accounts</h3>
        </div>
        {isAuthenticated ? (
          leaderboard.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No leaderboard data.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {leaderboard.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={async () => {
                    try {
                      const res = await apiFetch(`/api/users?handle=${encodeURIComponent(item.handle)}`);
                      if (res.ok) {
                        const u = await res.json();
                        setViewingUser(apiUserToViewing(u, false));
                      }
                    } catch { }
                  }}
                  className="flex items-center gap-3 rounded-xl bg-surface p-2.5 text-left hover:bg-surface-elevated transition-colors w-full"
                >
                  <span className={cn('w-5 text-center text-sm font-black', item.rank === 1 ? 'text-gold' : item.rank === 2 ? 'text-gray-300' : item.rank === 3 ? 'text-orange-400' : 'text-muted-foreground')}>
                    {item.rank}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">
                    {item.avatarInitials || item.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{item.role}</p>
                  </div>
                  <span className="text-sm font-bold text-gold">{formatCount(item.points)}</span>
                </button>
              ))}
            </div>
          )
        ) : (
          <p className="text-xs text-muted-foreground py-2">Sign in to see top accounts.</p>
        )}
      </div>

      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Choose Your Teams</h3>
        </div>
        {isAuthenticated ? (
          teams.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No teams available.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => openTeamByHandle(team.handle)}
                  className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-surface border border-surface-border px-3 py-2 text-sm font-medium text-white hover:border-gold/30 transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-[10px] font-bold text-gold">
                    {team.avatarInitials || team.name.slice(0, 2).toUpperCase()}
                  </div>
                  {team.name}
                </button>
              ))}
            </div>
          )
        ) : (
          <p className="text-xs text-muted-foreground py-2">Sign in to see teams.</p>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No posts yet</p>
        </div>
      ) : (
        posts.map((item) => <FeedCard key={item.id} item={item} onShare={onShare} onComment={onComment} formatTime={formatTime} />)
      )}

      {spotlightItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 mt-2">
            <Zap className="h-4 w-4 text-gold" />
            <p className="text-sm font-bold text-white">Spotlight Videos</p>
          </div>
          <div className="flex flex-col gap-3">
            {spotlightItems.map((item) => (
              <div key={item.id} className="bg-[#1e2126] rounded-2xl p-4 mb-3 border border-surface-border">
                <div className="mb-3">
                  <p className="text-white text-sm font-medium">{item.content}</p>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                  {item.mediaUrls && item.mediaUrls.length > 0 ? (
                    (item.postType === 'video' || item.postType === 'spotlight') ? (
                      <video src={item.mediaUrls[0]} className="w-full h-full object-cover" controls playsInline preload="metadata" />
                    ) : (
                      <img src={item.mediaUrls[0]} alt={item.content || ''} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="h-full bg-gradient-to-br from-emerald-700 to-green-900 flex items-center justify-center">
                      <Zap className="h-12 w-12 text-white/30" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-surface-border/50">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3 w-3" />{formatCount(item.likeCount)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />{formatCount(item.commentCount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
    </PullToRefresh>
  );
}

function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-surface animate-pulse" />
          <div className="flex-1">
            <div className="h-3 w-24 rounded bg-surface animate-pulse mb-1" />
            <div className="h-2 w-16 rounded bg-surface animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-surface animate-pulse mb-2" />
        <div className="h-3 w-3/4 rounded bg-surface animate-pulse" />
        <div className="flex items-center justify-between border-t border-surface-border pt-3 mt-3">
          <div className="flex gap-4">
            <div className="h-3 w-8 rounded bg-surface animate-pulse" />
            <div className="h-3 w-8 rounded bg-surface animate-pulse" />
            <div className="h-3 w-8 rounded bg-surface animate-pulse" />
          </div>
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
  const homeGoals = events.filter(e => e.type === 'goal' && e.team === 'home');
  const awayGoals = events.filter(e => e.type === 'goal' && e.team === 'away');

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

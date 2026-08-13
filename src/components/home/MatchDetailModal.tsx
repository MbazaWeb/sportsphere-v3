'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, BarChart3, Goal, Clock, Info, Users, MapPin, Trophy, UserRound, Shirt,
  ChevronLeft, Heart, MessageCircle, Share2, TrendingUp, BarChart2, Send,
  CheckCircle2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/constants';

export interface MatchEvent {
  minute: number;
  type: string;
  player: string;
  team: string;
  detail?: string;
  assist?: string;
}

export interface MatchStatRow {
  label: string;
  home: number | string;
  away: number | string;
}

export interface MatchPlayerLine {
  name: string;
  team: 'home' | 'away';
  role?: string;
  number?: string | number;
  events?: string[];
}

export interface ApiMatch {
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
  events?: MatchEvent[];
  stats?: MatchStatRow[];
  players?: MatchPlayerLine[];
  coaches?: { home?: string; away?: string };
  continent?: string;
  country?: string;
  homeBadge?: string;
  awayBadge?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

interface MatchDetailModalProps {
  match: ApiMatch;
  onClose: () => void;
  onTeamClick: (name: string) => void;
  onPlayerClick: (name: string) => void;
}

type TabId = 'info' | 'stats' | 'events' | 'players' | 'chat';

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function statusLabel(status: string, minute: number | null) {
  const s = (status || '').toLowerCase();
  if (s === 'live') return minute != null ? `${minute}'` : 'LIVE';
  if (s === 'ht') return 'HT';
  if (s === 'ft' || s === 'finished') return 'FT';
  if (s === 'upcoming') return 'Upcoming';
  return status?.toUpperCase() || '—';
}

function statusColor(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'live') return 'bg-red-500/15 border-red-500/30 text-red-400';
  if (s === 'ht') return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
  if (s === 'ft') return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
  if (s === 'upcoming') return 'bg-sky-500/15 border-sky-500/30 text-sky-400';
  return 'bg-surface border-surface-border text-muted-foreground';
}

function buildFallbackStats(match: ApiMatch): MatchStatRow[] {
  if (match.stats && match.stats.length) return match.stats;
  const events = match.events || [];
  const homeGoals = events.filter((e) => e.type === 'goal' && e.team === 'home').length;
  const awayGoals = events.filter((e) => e.type === 'goal' && e.team === 'away').length;
  const homeY = events.filter((e) => /yellow/i.test(e.type) && e.team === 'home').length;
  const awayY = events.filter((e) => /yellow/i.test(e.type) && e.team === 'away').length;
  const homeR = events.filter((e) => /red/i.test(e.type) && e.team === 'home').length;
  const awayR = events.filter((e) => /red/i.test(e.type) && e.team === 'away').length;
  return [
    { label: 'Goals', home: match.homeScore ?? homeGoals, away: match.awayScore ?? awayGoals },
    { label: 'Yellow cards', home: homeY, away: awayY },
    { label: 'Red cards', home: homeR, away: awayR },
    { label: 'Goal events', home: homeGoals, away: awayGoals },
  ];
}

function playersFromEvents(match: ApiMatch): MatchPlayerLine[] {
  if (match.players && match.players.length) return match.players;
  const map = new Map<string, MatchPlayerLine>();
  for (const e of match.events || []) {
    const key = `${e.team}:${e.player}`;
    const existing = map.get(key) || {
      name: e.player,
      team: (e.team === 'away' ? 'away' : 'home') as 'home' | 'away',
      events: [],
    };
    const tag =
      e.type === 'goal'
        ? `\u26bd ${e.minute}'`
        : /yellow/i.test(e.type)
          ? `\u{1F7E8} ${e.minute}'`
          : /red/i.test(e.type)
            ? `\u{1F7E5} ${e.minute}'`
            : /sub/i.test(e.type)
              ? `\u{1F504} ${e.minute}'`
              : `${e.type} ${e.minute}'`;
    existing.events = [...(existing.events || []), tag];
    if (e.assist) {
      const aKey = `${e.team}:${e.assist}`;
      const assistRow = map.get(aKey) || {
        name: e.assist,
        team: (e.team === 'away' ? 'away' : 'home') as 'home' | 'away',
        events: [],
      };
      assistRow.events = [...(assistRow.events || []), `\u{1F3C5} ${e.minute}'`];
      map.set(aKey, assistRow);
    }
    map.set(key, existing);
  }
  return Array.from(map.values());
}

// ─── Mini prediction form ────────────────────────────────────────────────
function PredictionForm({ match, onSubmitted }: { match: ApiMatch; onSubmitted: () => void }) {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [confidence, setConfidence] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    if (isNaN(h) || isNaN(a)) return;
    setLoading(true);
    try {
      const content = `\u{1F3C5} My prediction: ${match.homeTeam} ${h} - ${a} ${match.awayTeam} (${confidence} confidence) #${match.league.replace(/\s+/g, '')}`;
      await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          postType: 'prediction',
          hashtags: [match.league, 'Prediction', match.homeTeam, match.awayTeam].filter(Boolean),
          prediction: {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            predictedHome: h,
            predictedAway: a,
            confidence: confidence as 'low' | 'medium' | 'high',
          },
        }),
      });
      setSubmitted(true);
      onSubmitted();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-emerald-300">Prediction posted!</p>
        <p className="text-xs text-emerald-400/70 mt-1">Check the feed to see it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Your Prediction</p>
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-slate-400 truncate max-w-[80px] text-center">{match.homeTeam}</span>
          <input
            type="number" min={0} max={30} value={homeScore} onChange={(e) => setHomeScore(e.target.value)}
            className="w-16 h-12 rounded-xl bg-white/5 border border-white/10 text-center text-2xl font-black text-white focus:border-amber-400/50 focus:outline-none"
            placeholder="?"
          />
        </div>
        <span className="text-xl font-bold text-slate-500">vs</span>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-slate-400 truncate max-w-[80px] text-center">{match.awayTeam}</span>
          <input
            type="number" min={0} max={30} value={awayScore} onChange={(e) => setAwayScore(e.target.value)}
            className="w-16 h-12 rounded-xl bg-white/5 border border-white/10 text-center text-2xl font-black text-white focus:border-amber-400/50 focus:outline-none"
            placeholder="?"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-center">
        {(['low', 'medium', 'high'] as const).map((c) => (
          <button key={c} onClick={() => setConfidence(c)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all',
              confidence === c ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 ring-1 ring-amber-400/20'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10',
            )}>
            {c}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit} disabled={loading || homeScore === '' || awayScore === ''}
        className="w-full py-2.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-200 font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-amber-400/25 transition"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Posting...' : 'Post Prediction'}
      </button>
    </div>
  );
}

// ─── Mini poll creation form ─────────────────────────────────────────────
function PollForm({ match, onSubmitted }: { match: ApiMatch; onSubmitted: () => void }) {
  const [question, setQuestion] = useState('');
  const [opt1, setOpt1] = useState(match.homeTeam);
  const [opt2, setOpt2] = useState(match.awayTeam);
  const [opt3, setOpt3] = useState('Draw');
  const [useOpt3, setUseOpt3] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const q = question.trim() || `Who will win: ${match.homeTeam} vs ${match.awayTeam}?`;
    const options = [opt1.trim(), opt2.trim()];
    if (useOpt3 && opt3.trim()) options.push(opt3.trim());
    if (options.length < 2) return;
    setLoading(true);
    try {
      await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: q,
          postType: 'poll',
          hashtags: [match.league, 'Poll', match.homeTeam, match.awayTeam].filter(Boolean),
          poll: { question: q, options, durationHours: 48 },
        }),
      });
      setSubmitted(true);
      onSubmitted();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-emerald-300">Poll posted!</p>
        <p className="text-xs text-emerald-400/70 mt-1">Check the Polls tab to see votes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Create a Poll</p>
      <input
        value={question} onChange={(e) => setQuestion(e.target.value)}
        placeholder={`Who will win: ${match.homeTeam} vs ${match.awayTeam}?`}
        className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
      />
      <div className="space-y-2">
        <input value={opt1} onChange={(e) => setOpt1(e.target.value)}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/30"
          placeholder="Option 1" />
        <input value={opt2} onChange={(e) => setOpt2(e.target.value)}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/30"
          placeholder="Option 2" />
        {useOpt3 && (
          <input value={opt3} onChange={(e) => setOpt3(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/30"
            placeholder="Option 3 (optional)" />
        )}
        <button onClick={() => setUseOpt3(!useOpt3)} className="text-[10px] text-slate-500 hover:text-slate-300">
          {useOpt3 ? '- Remove 3rd option' : '+ Add 3rd option'}
        </button>
      </div>
      <button
        onClick={handleSubmit} disabled={loading}
        className="w-full py-2.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-200 font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-amber-400/25 transition"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Posting...' : 'Post Poll'}
      </button>
    </div>
  );
}

// ─── Quick comment (inline) ─────────────────────────────────────────────
function QuickComment({ matchId, onCountChange }: { matchId: string; onCountChange: (delta: number) => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
    setLoading(true);
    try {
      await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text.trim(),
          postType: 'post',
          hashtags: ['MatchChat'],
        }),
      });
      setText('');
      onCountChange(1);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        placeholder={isAuthenticated ? 'Say something about this match...' : 'Login to comment...'}
        className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
      />
      <button onClick={handleSubmit} disabled={loading || !text.trim()}
        className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 disabled:opacity-30 hover:bg-amber-400/25 transition"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Share menu ──────────────────────────────────────────────────────────
function ShareMatchMenu({ match, onClose }: { match: ApiMatch; onClose: () => void }) {
  const shareText = `${match.homeTeam} ${match.homeScore ?? 'v'} - ${match.awayScore ?? 'v'} ${match.awayTeam} | ${match.league} #SportSphere`;
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${shareUrl}/scores`);
    }
    onClose();
  };

  const handleNativeShare = () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({ title: `${match.homeTeam} vs ${match.awayTeam}`, text: shareText, url: `${shareUrl}/scores` });
    }
    onClose();
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl + '/scores')}`;
    window.open(url, '_blank');
    onClose();
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl + '/scores')}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#0f1a2e] border border-white/10 p-5"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <h3 className="mb-3 text-sm font-bold text-white">Share Match</h3>
        <div className="space-y-1">
          <button onClick={handleCopyLink} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white hover:bg-white/5 transition">Copy Link</button>
          <button onClick={handleNativeShare} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white hover:bg-white/5 transition">Share...</button>
          <button onClick={handleWhatsApp} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white hover:bg-white/5 transition">WhatsApp</button>
          <button onClick={handleTwitter} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white hover:bg-white/5 transition">Twitter / X</button>
        </div>
        <button onClick={onClose} className="mt-3 w-full rounded-xl bg-white/5 py-3 text-sm font-semibold text-slate-400 hover:bg-white/10 transition">Cancel</button>
      </motion.div>
    </div>
  );
}

// ─── Main MatchDetailModal ──────────────────────────────────────────────
export function MatchDetailModal({ match, onClose, onTeamClick, onPlayerClick }: MatchDetailModalProps) {
  const [tab, setTab] = useState<TabId>('info');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const setViewingPostId = useUIStore((s) => s.setViewingPostId);

  const events = useMemo(() => [...(match.events || [])].sort((a, b) => a.minute - b.minute), [match.events]);
  const stats = useMemo(() => buildFallbackStats(match), [match]);
  const players = useMemo(() => playersFromEvents(match), [match]);
  const homePlayers = players.filter((p) => p.team === 'home');
  const awayPlayers = players.filter((p) => p.team === 'away');

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    // Post a like-type engagement post
    try {
      await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `\u2764\uFE0F ${match.homeTeam} vs ${match.awayTeam} - ${match.league}`,
          postType: 'post',
          hashtags: ['MatchLike', match.league, match.homeTeam, match.awayTeam].filter(Boolean),
        }),
      });
    } catch { /* ignore */ }
  }, [isAuthenticated, liked, match, setLoginModalOpen]);

  const handleComment = useCallback(() => {
    setTab('chat');
  }, []);

  const handleOpenComments = useCallback(() => {
    // Create a match discussion post and open comment sheet
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
    setViewingPostId('match-chat-trigger');
  }, [isAuthenticated, setLoginModalOpen, setViewingPostId]);

  const kickoff = match.kickoffAt
    ? new Date(match.kickoffAt).toLocaleString(undefined, {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  const tabs: { id: TabId; label: string; icon: typeof Info }[] = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Match details"
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0B1220] border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0B1220]/95 backdrop-blur px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <button type="button" onClick={onClose} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/5 hover:bg-white/10" aria-label="Back">
                  <ChevronLeft className="h-5 w-5 text-slate-200" />
                </button>
                <Trophy className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">Match Details</p>
                  <p className="text-[11px] text-slate-400 truncate">{match.league}{match.country ? ` · ${match.country}` : ''}</p>
                </div>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10" aria-label="Close">
                <X className="h-4 w-4 text-slate-300" />
              </button>
            </div>

            {/* Scoreboard */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-white/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => onTeamClick(match.homeTeam)} className="flex flex-1 flex-col items-center gap-2 min-w-0 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/15 text-sm font-bold text-white group-hover:border-amber-400/50 overflow-hidden">
                    {match.homeBadge ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={match.homeBadge} alt="" className="h-8 w-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                    ) : initials(match.homeTeam)}
                  </div>
                  <span className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">{match.homeTeam}</span>
                </button>

                <div className="flex flex-col items-center px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black tabular-nums text-white">{match.homeScore ?? '—'}</span>
                    <span className="text-lg text-slate-500 font-bold">-</span>
                    <span className="text-3xl font-black tabular-nums text-white">{match.awayScore ?? '—'}</span>
                  </div>
                  <span className={cn('mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', statusColor(match.status))}>
                    {(match.status === 'live' || match.status === 'ht') && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
                    {statusLabel(match.status, match.minute)}
                  </span>
                </div>

                <button type="button" onClick={() => onTeamClick(match.awayTeam)} className="flex flex-1 flex-col items-center gap-2 min-w-0 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/15 text-sm font-bold text-white group-hover:border-amber-400/50 overflow-hidden">
                    {match.awayBadge ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={match.awayBadge} alt="" className="h-8 w-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                    ) : initials(match.awayTeam)}
                  </div>
                  <span className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">{match.awayTeam}</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-3 flex gap-1 overflow-x-auto">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition',
                    tab === id ? 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30' : 'text-slate-400 hover:bg-white/5',
                  )}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4 pb-8">
            {tab === 'info' && (
              <div className="space-y-3">
                <InfoRow icon={Trophy} label="Competition" value={match.league} />
                {match.country && <InfoRow icon={MapPin} label="Country" value={match.country} />}
                {match.venue && <InfoRow icon={MapPin} label="Venue" value={match.venue} />}
                {kickoff && <InfoRow icon={Clock} label="Kick-off" value={kickoff} />}
                <InfoRow icon={Goal} label="Result" value={`${match.homeTeam} ${match.homeScore ?? '—'} \u2013 ${match.awayScore ?? '—'} ${match.awayTeam}`} />
                {(match.coaches?.home || match.coaches?.away) && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <UserRound className="h-3.5 w-3.5" /> Coaches
                    </p>
                    {match.coaches?.home && <p className="text-sm text-slate-200"><span className="text-slate-500">Home:</span> {match.coaches.home}</p>}
                    {match.coaches?.away && <p className="text-sm text-slate-200"><span className="text-slate-500">Away:</span> {match.coaches.away}</p>}
                  </div>
                )}
              </div>
            )}

            {tab === 'stats' && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">Match statistics</p>
                {stats.map((row) => (
                  <StatBar key={row.label} label={row.label} home={row.home} away={row.away} />
                ))}
                {!match.stats?.length && (
                  <p className="text-[11px] text-slate-500 pt-2">Detailed possession / shots appear when the admin sends full stats.</p>
                )}
              </div>
            )}

            {tab === 'events' && (
              <div className="space-y-2">
                {events.length === 0 ? (
                  <Empty icon={Clock} title="No events logged" body="Goals, cards and subs will show here when available." />
                ) : (
                  events.map((e, i) => (
                    <button key={`${e.minute}-${e.player}-${i}`} type="button" onClick={() => e.player && onPlayerClick(e.player)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-left hover:bg-white/5">
                      <span className="w-8 text-xs font-bold text-amber-400 tabular-nums">{e.minute}&apos;</span>
                      <span className="text-base">
                        {e.type === 'goal' ? '\u26bd' : /yellow/i.test(e.type) ? '\u{1F7E8}' : /red/i.test(e.type) ? '\u{1F7E5}' : /sub/i.test(e.type) ? '\u{1F504}' : '\u2022'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{e.player || e.type}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {e.team === 'away' ? match.awayTeam : match.homeTeam}{e.assist ? ` · Assist: ${e.assist}` : ''}{e.detail ? ` · ${e.detail}` : ''}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {tab === 'players' && (
              <div className="grid grid-cols-2 gap-3">
                <PlayerColumn title={match.homeTeam} players={homePlayers} onPlayerClick={onPlayerClick} />
                <PlayerColumn title={match.awayTeam} players={awayPlayers} onPlayerClick={onPlayerClick} />
                {!players.length && (
                  <div className="col-span-2"><Empty icon={Shirt} title="No player events yet" body="Scorers and carded players appear here from match events." /></div>
                )}
              </div>
            )}

            {tab === 'chat' && (
              <div className="space-y-4">
                <QuickComment matchId={match.id} onCountChange={(d) => setChatCount((c) => c + d)} />
                <div className="border-t border-white/10 pt-4 space-y-4">
                  <PredictionForm match={match} onSubmitted={() => {}} />
                  <PollForm match={match} onSubmitted={() => {}} />
                </div>
              </div>
            )}
          </div>

          {/* ─── Sticky Action Bar ──────────────────────────────────── */}
          <div className="sticky bottom-0 z-10 border-t border-white/10 bg-[#0B1220]/95 backdrop-blur px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleLike}
                  className={cn(
                    'flex items-center gap-1.5 transition-all duration-200 p-2.5 rounded-xl min-h-[44px]',
                    liked ? 'text-pink-400 bg-pink-400/10' : 'text-slate-400 hover:text-pink-400 hover:bg-white/5',
                  )}>
                  <Heart className={cn('h-[18px] w-[18px]', liked && 'fill-current scale-110')} />
                  <span className="text-xs font-semibold">{formatCount(likeCount + (liked ? 1 : 0))}</span>
                </button>
                <button onClick={handleComment}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-all duration-200 p-2.5 rounded-xl min-h-[44px]">
                  <MessageCircle className="h-[18px] w-[18px]" />
                  <span className="text-xs font-semibold">{formatCount(chatCount)}</span>
                </button>
                <button onClick={() => setShowShare(true)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-all duration-200 p-2.5 rounded-xl min-h-[44px]">
                  <Share2 className="h-[18px] w-[18px]" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setTab('chat')} className="flex items-center gap-1 text-slate-400 hover:text-sky-400 transition-all p-2.5 rounded-xl min-h-[44px]">
                  <TrendingUp className="h-[18px] w-[18px]" />
                  <span className="text-[10px] font-semibold">Predict</span>
                </button>
                <button onClick={() => setTab('chat')} className="flex items-center gap-1 text-slate-400 hover:text-purple-400 transition-all p-2.5 rounded-xl min-h-[44px]">
                  <BarChart2 className="h-[18px] w-[18px]" />
                  <span className="text-[10px] font-semibold">Poll</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && <ShareMatchMenu match={match} onClose={() => setShowShare(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Reusable sub-components ─────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: typeof Info; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
      <Icon className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
        <p className="text-sm text-white font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatBar({ label, home, away }: { label: string; home: number | string; away: number | string }) {
  const h = typeof home === 'number' ? home : parseFloat(String(home)) || 0;
  const a = typeof away === 'number' ? away : parseFloat(String(away)) || 0;
  const total = h + a || 1;
  const hPct = Math.round((h / total) * 100);
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-bold tabular-nums text-white">{home}</span>
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold tabular-nums text-white">{away}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="bg-sky-500 transition-all" style={{ width: `${hPct}%` }} />
        <div className="bg-rose-500 transition-all" style={{ width: `${100 - hPct}%` }} />
      </div>
    </div>
  );
}

function PlayerColumn({ title, players, onPlayerClick }: { title: string; players: MatchPlayerLine[]; onPlayerClick: (name: string) => void }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 truncate">{title}</p>
      <div className="space-y-1.5">
        {players.map((p) => (
          <button key={p.name} type="button" onClick={() => onPlayerClick(p.name)} className="w-full rounded-lg border border-white/5 bg-white/[0.03] px-2 py-2 text-left hover:bg-white/5">
            <p className="text-xs font-semibold text-white truncate">{p.name}</p>
            {p.events && p.events.length > 0 && <p className="text-[10px] text-slate-400 mt-0.5">{p.events.join(' \u00B7 ')}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

function Empty({ icon: Icon, title, body }: { icon: typeof Info; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <Icon className="h-8 w-8 text-slate-600 mb-2" />
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{body}</p>
    </div>
  );
}

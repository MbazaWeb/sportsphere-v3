'use client';
import { apiFetch } from '@/lib/api';

import { Heart, MessageCircle, Share2, Bookmark, Check, RotateCcw, Pencil, ImageOff, VideoOff, Eye, TrendingUp, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BadgeStack } from '@/components/ui/RoleBadge';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/store/useAppStore';
import { useState, useCallback } from 'react';
import { EditPredictionModal } from './EditPredictionModal';

// Types
interface ApiUser {
  id: string; name: string; handle: string; avatarUrl?: string | null; avatarInitials: string;
  isVerified: boolean; isPro?: boolean; coverGradient: string; bio: string; role: string;
  location: string; followerCount: number; followingCount: number;
  postCount: number; registeredAt: string; verificationStatus: string;
}

interface ApiPoll {
  id: string;
  question: string;
  options: string[];
  totalVotes: number;
  optionCounts?: number[];
  userVotedOption?: number | null;
  endsAt?: string | null;
}

interface ApiPrediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  predictedHome: number | null;
  predictedAway: number | null;
  confidence: string | null;
  result?: string | null;
  isCorrect?: boolean | null;
}

interface ApiPost {
  id: string; userId: string; content: string; postType: string;
  mediaUrls: string[]; teamTag: string | null; playerTag: string | null;
  isBreaking: boolean; likeCount: number; commentCount: number;
  shareCount: number; viewCount: number; createdAt: string;
  poll?: ApiPoll | null;
  prediction?: ApiPrediction | null;
  user: ApiUser;
}

interface FeedCardProps {
  item: ApiPost;
  onShare: (id: string) => void;
  onComment: (id: string) => void;
  formatTime: (s: string) => string;
}

export function FeedCard({ item, onShare, onComment, formatTime }: FeedCardProps) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUserId = useAuthStore((s) => s.userProfile?.id);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const isLongPost = item.content.length > 200;
  const user = item.user;

  const handleViewUser = useCallback(() => {
    setViewingUser({
      id: user.id, name: user.name, handle: user.handle, avatar: user.avatarUrl || user.avatarInitials,
      verified: user.isVerified, coverGradient: user.coverGradient, bio: user.bio || '',
      role: user.role, location: user.location || '',
      joined: user.registeredAt ? new Date(user.registeredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
      followers: user.followerCount || 0, following: user.followingCount || 0, posts: user.postCount || 0, isFollowing: false,
    });
  }, [user, setViewingUser]);

  const handleSave = () => {
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
    setSaved(!saved);
  };

  if (hidden) return null;

  let welcomeMeta: { type?: string; gradient?: string; accentColor?: string; emoji?: string; roleLabel?: string } | null = null;
  if (item.postType === 'welcome' && item.mediaUrls && item.mediaUrls.length > 0) {
    try { welcomeMeta = JSON.parse(item.mediaUrls[0]); } catch {}
  }
  const contentHashtags = (item as any).hashtags || [];

  return (
    <article className="glass-card premium-card rounded-2xl overflow-hidden">
      {/* Breaking news banner */}
      {item.isBreaking && (
        <div className="flex items-center gap-2 border-b border-gold/20 bg-gold/5 px-4 py-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Breaking</span>
        </div>
      )}

      {/* Welcome post banner */}
      {welcomeMeta && welcomeMeta.gradient && (
        <div className={cn('relative overflow-hidden px-5 py-6 bg-gradient-to-br', welcomeMeta.gradient)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{welcomeMeta.emoji || '⚽'}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-white">{welcomeMeta.roleLabel || 'Welcome'}</span>
            </div>
            <p className="text-sm leading-relaxed text-white/95">{item.content}</p>
            {contentHashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {contentHashtags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm text-[10px] font-medium text-white/80">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Author header */}
        <button onClick={handleViewUser} className="mb-3 flex items-center gap-3 text-left w-full">
          <div className={cn(
            'flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold ring-2 ring-transparent transition-all',
            user.isVerified ? 'bg-gold text-black ring-gold/20' : 'bg-surface-elevated text-white'
          )}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user.avatarInitials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-white truncate">{user.name}</span>
              <BadgeStack role={user.role} isVerified={user.isVerified} isPro={user.isPro} size="xs" />
            </div>
            <span className="text-[11px] text-muted-foreground">{user.handle} · {formatTime(item.createdAt)}</span>
          </div>
        </button>

        {/* Content */}
        {isLongPost && !expanded ? (
          <div className="mb-3">
            <p className="text-[13px] leading-relaxed text-foreground/90">{item.content.slice(0, 200)}...</p>
            <button onClick={() => setExpanded(true)} className="text-xs font-bold text-gold hover:text-gold/80 transition-colors mt-1">
              See more
            </button>
          </div>
        ) : (
          <p className="mb-3 text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap">{item.content}</p>
        )}
        {isLongPost && expanded && (
          <button onClick={() => setExpanded(false)} className="mb-3 text-xs font-semibold text-muted-foreground hover:text-gold transition-colors">
            Show less
          </button>
        )}

        {/* Team tag */}
        {item.teamTag && (
          <span className="mb-3 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold border bg-gold/10 text-gold border-gold/20">
            {item.teamTag}
          </span>
        )}

        {/* Photo */}
        {item.postType === 'photo' && (
          <div className="mb-3 overflow-hidden rounded-xl bg-surface-elevated">
            {item.mediaUrls && item.mediaUrls.length > 0 ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.mediaUrls[0]}
                  alt={item.content || 'Post image'}
                  className="w-full max-h-80 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    const fallback = img.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-surface-elevated">
                  <ImageOff className="h-8 w-8" />
                  <span className="text-xs">Image failed to load</span>
                </div>
              </div>
            ) : (
              <div className="h-52 bg-gradient-to-br from-gold via-orange-600 to-red-800 flex items-end p-3">
                <span className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {item.teamTag || 'Photo'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Video */}
        {item.postType === 'video' && (
          <div className="mb-3 relative h-52 overflow-hidden rounded-xl bg-surface-elevated">
            {item.mediaUrls && item.mediaUrls.length > 0 ? (
              <div className="relative h-full w-full">
                <video
                  src={item.mediaUrls[0]}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                  onError={(e) => {
                    const vid = e.target as HTMLVideoElement;
                    vid.style.display = 'none';
                    const fallback = vid.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-surface-elevated">
                  <VideoOff className="h-8 w-8" />
                  <span className="text-xs">Video failed to load</span>
                </div>
              </div>
            ) : (
              <div className="h-full bg-gradient-to-br from-gold to-red-800 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-[14px] border-l-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Poll */}
        {item.poll && item.poll.options && item.poll.options.length > 0 && (
          <PollBlock
            postId={item.id}
            poll={item.poll}
            isAuthenticated={isAuthenticated}
            onRequireAuth={() => setLoginModalOpen(true)}
          />
        )}

        {/* Prediction */}
        {item.prediction && (
          <PredictionBlock
            prediction={item.prediction}
            isOwner={currentUserId === item.userId}
            onDeleted={() => setHidden(true)}
          />
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-surface-border/60">
          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                if (!isAuthenticated) { setLoginModalOpen(true); return; }
                setLiked(!liked);
                try {
                  await apiFetch('/api/likes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postId: item.id }),
                  });
                } catch { }
              }}
              className={cn(
                'flex items-center gap-1.5 transition-all duration-200 p-2.5 rounded-xl min-h-[44px]',
                liked ? 'text-pink-400 bg-pink-400/10' : 'text-muted-foreground hover:text-pink-400 hover:bg-surface'
              )}>
              <Heart className={cn('h-[18px] w-[18px]', liked && 'fill-current scale-110')} />
              <span className="text-xs font-semibold">{formatCount(item.likeCount + (liked ? 1 : 0))}</span>
            </button>
            <button onClick={() => onComment(item.id)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-gold hover:bg-surface transition-all duration-200 p-2.5 rounded-xl min-h-[44px]">
              <MessageCircle className="h-[18px] w-[18px]" />
              <span className="text-xs font-semibold">{formatCount(item.commentCount)}</span>
            </button>
            <button onClick={() => onShare(item.id)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-gold hover:bg-surface transition-all duration-200 p-2.5 rounded-xl min-h-[44px]">
              <Share2 className="h-[18px] w-[18px]" />
              <span className="text-xs font-semibold">{formatCount(item.shareCount)}</span>
            </button>
          </div>
          <div className="flex items-center gap-1">
            {item.viewCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 mr-1">
                <Eye className="h-3.5 w-3.5" />
                {formatCount(item.viewCount)}
              </span>
            )}
            <button onClick={handleSave}
              className={cn(
                'transition-all duration-200 p-2.5 rounded-xl min-h-[44px]',
                saved ? 'text-gold bg-gold/10' : 'text-muted-foreground hover:text-gold hover:bg-surface'
              )}>
              <Bookmark className={cn('h-[18px] w-[18px]', saved && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Poll Block ───────────────────────────────────────────────
function PollBlock({
  poll,
  isAuthenticated,
  onRequireAuth,
}: {
  postId: string;
  poll: ApiPoll;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}) {
  const [votedOption, setVotedOption] = useState<number | null>(poll.userVotedOption ?? null);
  const [optionCounts, setOptionCounts] = useState<number[]>(poll.optionCounts ?? poll.options.map(() => 0));
  const [busy, setBusy] = useState(false);

  const totalVotes = optionCounts.reduce((a, b) => a + b, 0);
  const hasVoted = votedOption !== null;
  const pollClosed = !!poll.endsAt && new Date(poll.endsAt) < new Date();
  const showResults = hasVoted || pollClosed;

  const handleVote = async (i: number) => {
    if (!isAuthenticated) { onRequireAuth(); return; }
    if (busy || pollClosed) return;
    if (votedOption === i) return;
    const prevVoted = votedOption;
    const prevCounts = optionCounts;
    const nextCounts = [...optionCounts];
    if (prevVoted !== null) {
      if (nextCounts[prevVoted] > 0) nextCounts[prevVoted] -= 1;
      nextCounts[i] += 1;
    } else {
      nextCounts[i] += 1;
    }
    setOptionCounts(nextCounts);
    setVotedOption(i);
    setBusy(true);
    try {
      const res = await apiFetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id, optionIndex: i }),
      });
      if (!res.ok) { setVotedOption(prevVoted); setOptionCounts(prevCounts); }
    } catch { setVotedOption(prevVoted); setOptionCounts(prevCounts); }
    finally { setBusy(false); }
  };

  const handleUnvote = async () => {
    if (!isAuthenticated) { onRequireAuth(); return; }
    if (busy || pollClosed || votedOption === null) return;
    const prevVoted = votedOption;
    const prevCounts = optionCounts;
    const nextCounts = [...optionCounts];
    if (nextCounts[prevVoted] > 0) nextCounts[prevVoted] -= 1;
    setOptionCounts(nextCounts);
    setVotedOption(null);
    setBusy(true);
    try {
      const res = await apiFetch('/api/polls/vote', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id }),
      });
      if (!res.ok) { setVotedOption(prevVoted); setOptionCounts(prevCounts); }
    } catch { setVotedOption(prevVoted); setOptionCounts(prevCounts); }
    finally { setBusy(false); }
  };

  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-white">{poll.question}</p>
        {pollClosed && (
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Closed</span>
        )}
      </div>
      {poll.options.map((opt: string, i: number) => {
        const count = optionCounts[i] ?? 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isMyChoice = votedOption === i;
        return (
          <button
            key={i}
            onClick={() => handleVote(i)}
            disabled={busy || pollClosed}
            className={cn(
              'relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200',
              isMyChoice ? 'bg-gold/15 border border-gold/30' : 'bg-surface border border-surface-border',
              showResults && !isMyChoice && 'opacity-60',
              busy ? 'cursor-wait' : 'cursor-pointer hover:border-gold/20'
            )}>
            {showResults && (
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ease-out',
                  isMyChoice ? 'bg-gold/20' : 'bg-surface-elevated/50'
                )}
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="relative flex items-center justify-between">
              <span className="text-[13px] font-medium text-white">{opt}</span>
              <div className="flex items-center gap-1.5">
                {isMyChoice && <Check className="h-3.5 w-3.5 text-gold" />}
                {showResults && <span className="text-xs font-bold text-muted-foreground tabular-nums">{pct}%</span>}
              </div>
            </div>
          </button>
        );
      })}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {totalVotes.toLocaleString()} vote{totalVotes === 1 ? '' : 's'}
          {hasVoted && !pollClosed && ' · You voted'}
          {pollClosed && hasVoted && ' · Your final vote'}
        </p>
        {hasVoted && !pollClosed && (
          <button
            onClick={handleUnvote}
            disabled={busy}
            className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-gold transition-colors disabled:opacity-50"
            title="Remove your vote"
          >
            <RotateCcw className="h-3 w-3" />
            {busy ? 'Updating...' : 'Change vote'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Prediction Block ─────────────────────────────────────────
function PredictionBlock({
  prediction,
  isOwner,
  onDeleted,
}: {
  prediction: ApiPrediction;
  isOwner: boolean;
  onDeleted?: () => void;
}) {
  const [current, setCurrent] = useState(prediction);
  const [editing, setEditing] = useState(false);

  const hScore = current.predictedHome;
  const aScore = current.predictedAway;
  const resultLabel =
    hScore === null || aScore === null
      ? null
      : hScore > aScore ? `${current.homeTeam} wins`
      : aScore > hScore ? `${current.awayTeam} wins`
      : 'Draw';

  const confidenceColors: Record<string, string> = {
    low: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    high: 'text-green-400 bg-green-500/10 border-green-500/30',
  };
  const confidenceLabels: Record<string, string> = {
    low: 'Low confidence', medium: 'Medium confidence', high: 'High confidence',
  };
  const conf = current.confidence ?? 'medium';
  const resolved = typeof current.isCorrect === 'boolean';

  return (
    <div className="mb-3 rounded-xl border border-gold/20 bg-gold/5 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gold/15 bg-gold/5 px-3 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Prediction</span>
        {isOwner && !resolved && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded-full bg-surface/80 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground hover:text-gold transition-colors"
            title="Edit your prediction"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
        {isOwner && resolved && (
          <span className="rounded-full bg-surface/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">Yours</span>
        )}
      </div>
      <div className="px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-center min-w-0">
            <p className="text-sm font-bold text-white truncate">{current.homeTeam}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="rounded-lg bg-surface px-3 py-1.5 text-2xl font-black text-gold tabular-nums">{hScore ?? '–'}</span>
            <span className="text-muted-foreground text-sm">-</span>
            <span className="rounded-lg bg-surface px-3 py-1.5 text-2xl font-black text-gold tabular-nums">{aScore ?? '–'}</span>
          </div>
          <div className="flex-1 text-center min-w-0">
            <p className="text-sm font-bold text-white truncate">{current.awayTeam}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          {resultLabel && <span className="text-xs text-muted-foreground">{resultLabel}</span>}
          <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', confidenceColors[conf] ?? confidenceColors.medium)}>
            {confidenceLabels[conf] ?? 'Medium confidence'}
          </span>
        </div>
        {resolved && (
          <p className="mt-2 text-center text-xs font-semibold text-white">
            {current.isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </p>
        )}
      </div>
      {isOwner && !resolved && (
        <EditPredictionModal
          open={editing}
          onOpenChange={setEditing}
          prediction={current}
          onUpdated={(data) => {
            setCurrent({ ...current, homeTeam: data.homeTeam, awayTeam: data.awayTeam, predictedHome: data.predictedHome, predictedAway: data.predictedAway, confidence: data.confidence });
          }}
          onDeleted={() => { onDeleted?.(); }}
        />
      )}
    </div>
  );
}
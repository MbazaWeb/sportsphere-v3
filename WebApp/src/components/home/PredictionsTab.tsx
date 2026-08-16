'use client';
import { apiFetch } from '@/lib/api';

import { useEffect, useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Target, Clock, CheckCircle2, XCircle, Plus, TrendingUp, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BadgeStack } from '@/components/ui/RoleBadge';
import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';
import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/store/useAppStore';
import { formatTime } from '@/lib/format';

// Types
interface ApiUser {
  id: string; name: string; handle: string; avatarUrl?: string | null; avatarInitials: string;
  isVerified: boolean; isPro?: boolean; coverGradient: string; bio: string; role: string;
  location: string; followerCount: number; followingCount: number;
  postCount: number; registeredAt: string; verificationStatus: string;
}

interface ApiPrediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  predictedHome: number | null;
  predictedAway: number | null;
  confidence: string | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  result: string | null;
  createdAt: string;
}

interface PredictionPost {
  id: string;
  userId: string;
  content: string;
  postType: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  createdAt: string;
  prediction: ApiPrediction;
  user: ApiUser;
}

interface PredictionsTabProps {
  onShare: (id: string) => void;
  onComment: (id: string) => void;
}

function PredictionStatusBadge({ prediction }: { prediction: ApiPrediction }) {
  if (prediction.isCorrect === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
        <CheckCircle2 className="h-3 w-3" /> Won
      </span>
    );
  }
  if (prediction.isCorrect === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase">
        <XCircle className="h-3 w-3" /> Lost
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string | null }) {
  if (!confidence) return null;
  const colors: Record<string, string> = {
    low: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase', colors[confidence] || colors.medium)}>
      {confidence} conf.
    </span>
  );
}

export function PredictionsTab({ onShare, onComment }: PredictionsTabProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  const [predictions, setPredictions] = useState<PredictionPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch('/api/predictions?limit=20');
        if (res.ok) {
          const data = await res.json();
          setPredictions(data);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleMakePrediction = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    setActiveTab('create');
  };

  const handleUserClick = useCallback((post: PredictionPost) => {
    const u = post.user;
    setViewingUser({
      id: u.id,
      name: u.name,
      handle: u.handle,
      avatar: u.avatarUrl || u.avatarInitials || u.name.slice(0, 2).toUpperCase(),
      avatarUrl: u.avatarUrl || null,
      verified: u.isVerified,
      coverGradient: u.coverGradient || 'from-emerald-600 to-emerald-900',
      bio: u.bio || '',
      role: u.role,
      location: u.location || '',
      joined: u.registeredAt,
      followers: u.followerCount,
      following: u.followingCount,
      posts: u.postCount,
      isFollowing: false,
    });
  }, [setViewingUser]);

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-gold" />
          <h2 className="text-base font-black text-white">Predictions</h2>
        </div>
        <button
          onClick={handleMakePrediction}
          className="flex items-center gap-1.5 rounded-xl bg-gold px-3 py-2 text-xs font-bold text-black hover:bg-gold/90 transition-colors active:scale-95 shadow-[0_4px_20px_rgba(245,197,24,0.2)]"
        >
          <Plus className="h-3.5 w-3.5" />
          Predict
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-surface animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-24 rounded bg-surface animate-pulse mb-1" />
                  <div className="h-2 w-16 rounded bg-surface animate-pulse" />
                </div>
              </div>
              <div className="h-16 w-full rounded-xl bg-surface animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && predictions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Target className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No predictions yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Be the first to predict match outcomes!</p>
          <button
            onClick={handleMakePrediction}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-black hover:bg-gold/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Make a Prediction
          </button>
        </div>
      )}

      {/* Prediction cards */}
      {!loading && predictions.map((post) => (
        <article key={post.id} className="glass-card rounded-2xl p-4 glass-card-hover">
          {/* User header */}
          <button onClick={() => handleUserClick(post)} className="mb-3 flex items-center gap-3 text-left w-full">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-bold flex-shrink-0',
              post.user.avatarUrl ? '' : (post.user.isVerified ? 'bg-gold text-black' : 'bg-surface text-white')
            )}>
              {post.user.avatarUrl ? (
                <img src={post.user.avatarUrl} alt={post.user.name} className="h-full w-full object-cover" />
              ) : (
                post.user.avatarInitials || post.user.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-white truncate">{post.user.name}</span>
                <BadgeStack role={post.user.role} isVerified={post.user.isVerified} size="xs" />
              </div>
              <p className="text-[11px] text-muted-foreground">{post.user.handle}</p>
            </div>
            <span className="text-[10px] text-muted-foreground/60">{formatTime(post.createdAt)}</span>
          </button>

          {/* Official indicator */}
          {(post.user.role === 'administrator' || post.user.role === 'moderator' || post.user.role === 'official') && (
            <div className="mb-2 inline-flex items-center gap-1 rounded-lg bg-gold/10 border border-gold/20 px-2 py-1">
              <ShieldCheck className="h-3 w-3 text-gold" />
              <span className="text-[10px] font-bold text-gold uppercase">Official Prediction</span>
            </div>
          )}

          {/* Prediction content */}
          <div className="rounded-xl bg-surface border border-surface-border p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold" />
                <span className="text-xs font-bold text-white">Score Prediction</span>
              </div>
              <PredictionStatusBadge prediction={post.prediction} />
            </div>
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-center">
                <p className="text-sm font-bold text-white">{post.prediction.homeTeam}</p>
                <p className="text-2xl font-black text-gold">{post.prediction.predictedHome ?? '?'}</p>
              </div>
              <span className="text-lg font-bold text-muted-foreground">-</span>
              <div className="text-center">
                <p className="text-sm font-bold text-white">{post.prediction.awayTeam}</p>
                <p className="text-2xl font-black text-gold">{post.prediction.predictedAway ?? '?'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-border">
              <ConfidenceBadge confidence={post.prediction.confidence} />
              {post.prediction.pointsEarned > 0 && (
                <span className="text-[10px] font-bold text-gold">+{post.prediction.pointsEarned} pts</span>
              )}
            </div>
          </div>

          {/* Engagement buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-5">
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-red-400 transition-colors">
                <Heart className="h-4 w-4" />
                <span className="text-xs">{formatCount(post.likeCount)}</span>
              </button>
              <button onClick={() => onComment(post.id)} className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-400 transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{formatCount(post.commentCount)}</span>
              </button>
            </div>
            <button onClick={() => onShare(post.id)} className="flex items-center gap-1.5 text-muted-foreground hover:text-emerald-400 transition-colors">
              <Share2 className="h-4 w-4" />
              <span className="text-xs">{formatCount(post.shareCount)}</span>
            </button>
          </div>
        </article>
      ))}

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}

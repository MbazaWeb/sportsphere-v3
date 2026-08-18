'use client';
import { apiFetch } from '@/lib/api';

import { useEffect, useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2, BarChart3, Plus, Clock, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BadgeStack } from '@/components/ui/RoleBadge';
import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';
import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/store/useAppStore';

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
  createdAt: string;
}

interface PollPost {
  id: string;
  userId: string;
  content: string;
  postType: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  createdAt: string;
  poll: ApiPoll;
  user: ApiUser;
}

interface PollsTabProps {
  onShare: (id: string) => void;
  onComment: (id: string) => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function getTimeRemaining(endsAt: string | null | undefined): string | null {
  if (!endsAt) return null;
  const remaining = new Date(endsAt).getTime() - Date.now();
  if (remaining <= 0) return 'Ended';
  const hours = Math.floor(remaining / 3600000);
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export function PollsTab({ onShare, onComment }: PollsTabProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const showToast = useUIStore((s) => s.showToast);

  const [polls, setPolls] = useState<PollPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  const loadPolls = useCallback(async () => {
    try {
      const res = await apiFetch('/api/polls?limit=20');
      if (res.ok) {
        const data = await res.json();
        setPolls(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    setVotingPollId(pollId);
    try {
      const res = await apiFetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, optionIndex }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update poll in state optimistically
        setPolls((prev) =>
          prev.map((p) => {
            if (p.poll.id !== pollId) return p;
            const newOptionCounts = [...(p.poll.optionCounts || p.poll.options.map(() => 0))];
            newOptionCounts[optionIndex] = (newOptionCounts[optionIndex] || 0) + 1;
            return {
              ...p,
              poll: {
                ...p.poll,
                totalVotes: data.totalVotes,
                optionCounts: newOptionCounts,
                userVotedOption: optionIndex,
              },
            };
          })
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to vote');
      }
    } catch {
      showToast('Network error');
    }
    setVotingPollId(null);
  };

  const handleCreatePoll = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    setActiveTab('create');
  };

  const handleUserClick = useCallback((post: PollPost) => {
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
          <BarChart3 className="h-5 w-5 text-gold" />
          <h2 className="text-base font-black text-white">Polls</h2>
        </div>
        <button
          onClick={handleCreatePoll}
          className="flex items-center gap-1.5 rounded-xl bg-gold px-3 py-2 text-xs font-bold text-black hover:bg-gold/90 transition-colors active:scale-95 shadow-[0_4px_20px_rgba(245,197,24,0.2)]"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Poll
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
              <div className="h-24 w-full rounded-xl bg-surface animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && polls.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No polls yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Create a poll to see what the community thinks!</p>
          <button
            onClick={handleCreatePoll}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-black hover:bg-gold/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create a Poll
          </button>
        </div>
      )}

      {/* Poll cards */}
      {!loading && polls.map((post) => {
        const poll = post.poll;
        const totalVotes = poll.totalVotes || 1;
        const hasVoted = poll.userVotedOption !== null && poll.userVotedOption !== undefined;
        const timeRemaining = getTimeRemaining(poll.endsAt);
        const isPollClosed = timeRemaining === 'Ended';

        return (
          <article key={post.id} className="glass-card rounded-2xl p-4 glass-card-hover">
            {/* User header */}
            <button onClick={() => handleUserClick(post)} className="mb-3 flex items-center gap-3 text-left w-full">
              <div className={cn(
                'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-bold flex-shrink-0',
                post.user?.avatarUrl ? '' : (post.user.isVerified ? 'bg-gold text-black' : 'bg-surface text-white')
              )}>
                {post.user?.avatarUrl ? (
                  <img src={post.user?.avatarUrl} alt={post.user.name} className="h-full w-full object-cover" />
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
                <span className="text-[10px] font-bold text-gold uppercase">Official Poll</span>
              </div>
            )}

            {/* Poll question */}
            <p className="text-sm font-bold text-white mb-3">{poll.question}</p>

            {/* Poll options */}
            <div className="flex flex-col gap-2 mb-3">
              {poll.options.map((option, index) => {
                const count = poll.optionCounts?.[index] || 0;
                const percentage = hasVoted || isPollClosed ? Math.round((count / totalVotes) * 100) : 0;
                const isVotedOption = poll.userVotedOption === index;
                const isVotingThis = votingPollId === poll.id;

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (!hasVoted && !isPollClosed) handleVote(poll.id, index);
                    }}
                    disabled={hasVoted || isPollClosed || isVotingThis}
                    className={cn(
                      'relative flex items-center gap-3 rounded-xl border overflow-hidden transition-all active:scale-[0.98]',
                      isVotedOption
                        ? 'border-gold/50 bg-gold/5'
                        : hasVoted || isPollClosed
                          ? 'border-surface-border bg-surface'
                          : 'border-surface-border bg-surface hover:border-gold/30 hover:bg-surface-elevated cursor-pointer'
                    )}
                  >
                    {/* Vote percentage bar */}
                    {(hasVoted || isPollClosed) && percentage > 0 && (
                      <div
                        className="absolute inset-0 bg-gold/10 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    <div className="relative z-10 flex items-center gap-3 w-full px-3 py-2.5">
                      {/* Option letter */}
                      <span className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold flex-shrink-0',
                        isVotedOption
                          ? 'bg-gold text-black'
                          : 'bg-surface-elevated text-gold'
                      )}>
                        {String.fromCharCode(65 + index)}
                      </span>

                      {/* Option text */}
                      <span className="flex-1 text-left text-sm text-white font-medium">{option}</span>

                      {/* Percentage (shown after vote) */}
                      {(hasVoted || isPollClosed) && (
                        <span className={cn(
                          'text-xs font-bold flex-shrink-0',
                          isVotedOption ? 'text-gold' : 'text-muted-foreground'
                        )}>
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Poll meta */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3 px-1">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{formatCount(totalVotes)} votes</span>
              </div>
              {timeRemaining && (
                <div className={cn('flex items-center gap-1', isPollClosed ? 'text-red-400' : 'text-muted-foreground')}>
                  <Clock className="h-3 w-3" />
                  <span>{timeRemaining}</span>
                </div>
              )}
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
        );
      })}

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}

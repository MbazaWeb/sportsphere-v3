'use client';

import { Heart, MessageCircle, Share2, Bookmark, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BadgeStack } from '@/components/ui/RoleBadge';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useState, useCallback } from 'react';

// Types
interface ApiUser {
  id: string; name: string; handle: string; avatarInitials: string;
  isVerified: boolean; coverGradient: string; bio: string; role: string;
  location: string; followerCount: number; followingCount: number;
  postCount: number; registeredAt: string; verificationStatus: string;
}

interface ApiPost {
  id: string; userId: string; content: string; postType: string;
  mediaUrls: string[]; teamTag: string | null; playerTag: string | null;
  isBreaking: boolean; likeCount: number; commentCount: number;
  shareCount: number; viewCount: number; createdAt: string;
  poll?: { id: string; question: string; options: string[]; totalVotes: number } | null;
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
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [pollVotes, setPollVotes] = useState(item.poll?.totalVotes ?? 0);
  const user = item.user;

  const handleViewUser = useCallback(() => {
    setViewingUser({
      id: user.id, name: user.name, handle: user.handle, avatar: user.avatarInitials,
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

  return (
    <article className="glass-card premium-card rounded-2xl overflow-hidden glass-card-hover">
      {item.isBreaking && (
        <div className="flex items-center gap-2 border-b border-gold/20 bg-gold/5 px-4 py-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-[10px] font-bold uppercase text-gold">Breaking</span>
        </div>
      )}
      <div className="p-4">
        <button onClick={handleViewUser} className="mb-3 flex items-center gap-3 text-left w-full">
          <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
            user.isVerified ? 'bg-gold text-black' : 'bg-surface text-white')}>
            {user.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-white">{user.name}</span>
              <BadgeStack role={user.role} isVerified={user.isVerified} size="xs" />
            </div>
            <span className="text-xs text-muted-foreground">{user.handle} · {formatTime(item.createdAt)}</span>
          </div>
        </button>

        <p className="mb-3 text-sm leading-relaxed text-foreground/90">{item.content}</p>

        {item.teamTag && (
          <span className="mb-3 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium border bg-gold/10 text-gold border-gold/20">
            {item.teamTag}
          </span>
        )}

        {item.postType === 'photo' && (
          <div className="mb-3 overflow-hidden rounded-xl bg-surface-elevated">
            {item.mediaUrls && item.mediaUrls.length > 0 ? (
              <img src={item.mediaUrls[0]} alt={item.content || 'Post image'} className="h-52 w-full object-cover" loading="lazy" />
            ) : (
              <div className="h-52 bg-gradient-to-br from-gold via-orange-600 to-red-800 flex items-end p-3">
                <span className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {item.teamTag || 'Photo'}
                </span>
              </div>
            )}
          </div>
        )}

        {item.postType === 'video' && (
          <div className="mb-3 relative h-52 overflow-hidden rounded-xl bg-surface-elevated">
            {item.mediaUrls && item.mediaUrls.length > 0 ? (
              <video src={item.mediaUrls[0]} className="h-full w-full object-cover" controls playsInline preload="metadata" />
            ) : (
              <div className="h-full bg-gradient-to-br from-gold to-red-800 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-[14px] border-l-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {item.poll && item.poll.options && item.poll.options.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            <p className="text-sm font-bold text-white mb-1">{item.poll.question}</p>
            {item.poll.options.map((opt: string, i: number) => {
              const basePct = Math.round(100 / item.poll!.options.length);
              const pct = votedOption !== null
                ? (i === votedOption ? Math.round(100 / item.poll!.options.length) + 5 : Math.round((100 - Math.round(100 / item.poll!.options.length) - 5) / (item.poll!.options.length - 1 || 1)))
                : basePct;
              return (
                <button
                  key={i}
                  onClick={async () => {
                    if (!isAuthenticated) { setLoginModalOpen(true); return; }
                    if (votedOption !== null) return;
                    setVotedOption(i);
                    setPollVotes(v => v + 1);
                    try {
                      await fetch('/api/polls/vote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pollId: item.poll!.id, optionIndex: i }),
                      });
                    } catch { }
                  }}
                  disabled={votedOption !== null}
                  className={cn(
                    'relative overflow-hidden rounded-lg p-3 text-left transition-all',
                    votedOption === i ? 'bg-gold/20 border border-gold/40' : 'bg-surface border border-surface-border',
                    votedOption !== null && votedOption !== i && 'opacity-60'
                  )}
                >
                  {votedOption !== null && (
                    <div className="absolute inset-y-0 left-0 bg-gold/20 rounded-lg transition-all duration-500" style={{ width: `${pct}%` }} />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{opt}</span>
                    {votedOption === i && <Check className="h-3.5 w-3.5 text-gold" />}
                    {votedOption !== null && <span className="text-xs font-bold text-muted-foreground">{pct}%</span>}
                  </div>
                </button>
              );
            })}
            <p className="text-xs text-muted-foreground">{pollVotes.toLocaleString()} votes{votedOption !== null && ' · You voted'}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-surface-border pt-3 mt-1">
          <button
            onClick={async () => {
              if (!isAuthenticated) { setLoginModalOpen(true); return; }
              setLiked(!liked);
              try {
                await fetch('/api/likes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ postId: item.id }),
                });
              } catch { }
            }}
            className={cn('flex items-center gap-1.5 transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md', liked ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400')}>
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            <span className="text-xs">{formatCount(item.likeCount + (liked ? 1 : 0))}</span>
          </button>
          <button onClick={() => onComment(item.id)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{formatCount(item.commentCount)}</span>
          </button>
          <button onClick={() => onShare(item.id)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md">
            <Share2 className="h-4 w-4" />
            <span className="text-xs">{formatCount(item.shareCount)}</span>
          </button>
          <button onClick={handleSave}
            className={cn('transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md', saved ? 'text-gold' : 'text-muted-foreground hover:text-gold')}>
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          </button>
        </div>
      </div>
    </article>
  );
}

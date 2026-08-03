'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Flame, Shield, Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { apiUserToViewing } from '@/types';

// Types from parent
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

export function TrendingTab() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  const [liveMatches, setLiveMatches] = useState<ApiMatch[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<ApiPost[]>([]);
  const [communities, setCommunities] = useState<Array<{ id: string; name: string; memberCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [matchesRes, feedRes, commRes] = await Promise.all([
          fetch('/api/matches?status=live'),
          fetch('/api/feed?type=trending'),
          fetch('/api/communities'),
        ]);
        if (matchesRes.ok) setLiveMatches(await matchesRes.json());
        if (feedRes.ok) setTrendingPosts(await feedRes.json());
        if (commRes.ok) setCommunities(await commRes.json());
      } catch (e) { }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleJoin = () => {
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
  };

  const toFeedUser = useCallback((user: ApiUser) => apiUserToViewing(user, false), []);

  return (
    <div className="p-4 flex flex-col gap-6">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" /> Live Now
        </h2>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 glass-card rounded-xl p-3 min-w-[175px]">
                <div className="h-3 w-16 rounded bg-surface animate-pulse mb-2" />
                <div className="h-4 w-full rounded bg-surface animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {liveMatches.map((m) => (
              <div key={m.id} className="flex-shrink-0 glass-card rounded-xl p-3 min-w-[175px] glass-card-hover">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" />
                  <span className="text-[10px] font-bold uppercase text-gold">{m.league} · {m.status === 'ht' ? 'HT' : `${m.minute}'`}</span>
                </div>
                <p className="text-sm font-semibold text-white">{m.homeTeam.split(' ').pop()} {m.homeScore}–{m.awayScore} {m.awayTeam.split(' ').pop()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-gold" /> Trending
        </h2>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : trendingPosts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No trending posts right now.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {trendingPosts.slice(0, 6).map((post) => {
              const fu = toFeedUser(post.user);
              return (
                <div key={post.id} className="flex items-center justify-between glass-card rounded-xl p-4 glass-card-hover">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface">
                      <Flame className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">#{post.content.split(' ').find(w => w.startsWith('#')) || 'Trending'}</p>
                      <p className="text-[10px] text-muted-foreground">{formatCount(post.likeCount)} likes</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatCount(post.commentCount)} comments</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!loading && trendingPosts.slice(0, 3).map((post) => {
        const fu = toFeedUser(post.user);
        return (
          <article key={post.id} className="glass-card rounded-2xl p-4 glass-card-hover">
            <button onClick={() => setViewingUser(fu)} className="mb-2 flex items-center gap-3 text-left w-full">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                fu.verified ? 'bg-gold text-black' : 'bg-surface text-white')}>
                {fu.avatar}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-white">{fu.name}</span>
                  {fu.verified && <Shield className="h-3 w-3 text-gold" />}
                </div>
                <span className="text-xs text-muted-foreground">{fu.handle}</span>
              </div>
            </button>
            <p className="text-sm text-foreground/90 line-clamp-2">{post.content}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatCount(post.likeCount)}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatCount(post.commentCount)}</span>
            </div>
          </article>
        );
      })}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Communities</h2>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between glass-card rounded-xl p-4">
                <div className="h-3 w-24 rounded bg-surface animate-pulse" />
                <div className="h-6 w-12 rounded bg-surface animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {communities.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between glass-card rounded-xl p-4 glass-card-hover">
                <div>
                  <p className="text-sm font-semibold text-white">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCount(c.memberCount)} members</p>
                </div>
                <button onClick={handleJoin}
                  className="rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-black hover:bg-gold/90 transition-colors">
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
        {!isAuthenticated && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <button onClick={() => setLoginModalOpen(true)} className="text-gold hover:underline">Sign in</button> to join communities
          </p>
        )}
      </section>
    </div>
  );
}

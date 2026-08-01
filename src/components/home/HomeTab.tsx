'use client';

import { useNavigationStore } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/store/useAppStore';
import { getFeedUser, HOME_FEED, SPOTLIGHT_FEED } from '@/data/feedData';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search, Bell, Heart, MessageCircle, Share2, Bookmark, TrendingUp, Zap, Shield } from 'lucide-react';
import type { HomeSubTab } from '@/store/navigationStore';
import { useState } from 'react';

const SUBTABS: { id: HomeSubTab; label: string }[] = [
  { id: 'for-you',   label: 'For You'   },
  { id: 'trending',  label: 'Trending'  },
  { id: 'spotlight', label: 'Spotlight' },
];

export default function HomeTab() {
  const homeSubTab    = useNavigationStore((s) => s.homeSubTab);
  const setHomeSubTab = useNavigationStore((s) => s.setHomeSubTab);
  const isAuthenticated  = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-white">SportSphere</h1>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => { if (!isAuthenticated) setLoginModalOpen(true); }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sport-green" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          {SUBTABS.map((tab) => (
            <button key={tab.id} onClick={() => setHomeSubTab(tab.id)}
              className={cn('rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                homeSubTab === tab.id ? 'bg-sport-green text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <motion.div key={homeSubTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {homeSubTab === 'for-you'   && <ForYouContent />}
        {homeSubTab === 'trending'  && <TrendingContent />}
        {homeSubTab === 'spotlight' && <SpotlightContent />}
      </motion.div>
    </div>
  );
}

// ─── For You ──────────────────────────────────────────────────
function ForYouContent() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {HOME_FEED.map((item) => <FeedCard key={item.id} item={item} />)}
    </div>
  );
}

function FeedCard({ item }: { item: typeof HOME_FEED[number] }) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const user = getFeedUser(item.handle);
  if (!user) return null;

  return (
    <article className="rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden">
      {item.breaking && (
        <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/10 px-4 py-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase text-red-400">Breaking</span>
        </div>
      )}
      <div className="p-4">
        {/* User header */}
        <button onClick={() => setViewingUser(user)} className="mb-3 flex items-center gap-3 text-left w-full">
          <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
            user.verified ? 'bg-sport-green text-black' : 'bg-surface text-white')}>
            {user.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{user.name}</span>
              {user.verified && <Shield className="h-3.5 w-3.5 text-sport-green" />}
            </div>
            <span className="text-xs text-muted-foreground">{user.handle} · {item.time}</span>
          </div>
        </button>

        {/* Content */}
        <p className="mb-3 text-sm leading-relaxed text-foreground/90">{item.content}</p>

        {/* Tag — clickable, opens profile */}
        {'tag' in item && item.tag && (
          <button
            onClick={() => {
              if (item.tag && 'handle' in item.tag && item.tag.handle) {
                const u = getFeedUser(item.tag.handle as string);
                if (u) setViewingUser(u);
              }
            }}
            className={cn('mb-3 inline-block rounded-lg px-2.5 py-1 text-xs font-medium border transition-opacity active:opacity-70',
              item.tag.type === 'team' ? 'bg-sport-green/10 text-sport-green border-sport-green/20 hover:bg-sport-green/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20')}>
            {item.tag.label}
          </button>
        )}

        {/* Photo */}
        {item.type === 'photo' && (
          <div className="mb-3 h-48 overflow-hidden rounded-xl bg-gradient-to-br from-red-800 via-red-700 to-orange-900 flex items-end p-3">
            <span className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">Emirates Stadium · Match Day</span>
          </div>
        )}

        {/* Video */}
        {item.type === 'video' && (
          <div className="mb-3 relative h-48 overflow-hidden rounded-xl bg-gradient-to-br from-green-800 to-emerald-900 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-[14px] border-l-white" />
            </div>
            <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">2:34</span>
          </div>
        )}

        {/* Poll */}
        {'poll' in item && item.poll && (
          <div className="mb-3 flex flex-col gap-2">
            {item.poll.map((opt, i) => (
              <button key={i} className="relative overflow-hidden rounded-lg bg-surface p-3 text-left">
                <div className="absolute inset-y-0 left-0 bg-sport-green/20 rounded-lg" style={{ width: `${opt.pct}%` }} />
                <div className="relative flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{opt.label}</span>
                  <span className="text-xs font-bold text-muted-foreground">{opt.pct}%</span>
                </div>
              </button>
            ))}
            <p className="text-xs text-muted-foreground">{'pollTotal' in item ? item.pollTotal?.toLocaleString() : ''} votes</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-surface-border pt-3 mt-1">
          <button onClick={() => setLiked(!liked)} className={cn('flex items-center gap-1.5 transition-colors', liked ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400')}>
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            <span className="text-xs">{formatCount(item.likes + (liked ? 1 : 0))}</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-sport-green transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{formatCount(item.comments)}</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-sport-green transition-colors">
            <Share2 className="h-4 w-4" />
            <span className="text-xs">{formatCount(item.shares)}</span>
          </button>
          <button onClick={() => setSaved(!saved)} className={cn('transition-colors', saved ? 'text-sport-green' : 'text-muted-foreground hover:text-sport-green')}>
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Trending ─────────────────────────────────────────────────
function TrendingContent() {
  const topics = [
    { t: '#PremierLeague', posts: '24.5K', hot: true },
    { t: '#Haaland',       posts: '18.2K', hot: true },
    { t: '#TransferWindow',posts: '15.8K', hot: false },
    { t: '#Arsenal',       posts: '12.3K', hot: false },
    { t: '#AFCON2025',     posts: '9.7K',  hot: true },
    { t: '#UCL',           posts: '8.1K',  hot: false },
  ];
  return (
    <div className="p-4 flex flex-col gap-6">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" /> Live Now
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {[
            { match: 'Man Utd 2–1 Arsenal', league: 'PL', min: "78'" },
            { match: 'Real Madrid 1–1 Barca', league: 'La Liga', min: 'HT' },
            { match: 'Inter 0–0 AC Milan', league: 'Serie A', min: "34'" },
          ].map((m, i) => (
            <div key={i} className="flex-shrink-0 rounded-xl bg-surface-elevated border border-surface-border p-3 min-w-[175px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-red-400">{m.league} · {m.min}</span>
              </div>
              <p className="text-sm font-semibold text-white">{m.match}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-4 w-4" /> Trending
        </h2>
        <div className="flex flex-col gap-2">
          {topics.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-surface-elevated border border-surface-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface">
                  {item.hot ? <Zap className="h-4 w-4 text-yellow-400" /> : <TrendingUp className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="text-sm font-semibold text-white">{item.t}</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.posts} posts</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Communities</h2>
        <div className="flex flex-col gap-2">
          {[{ name:'Gooners', m:'125K' }, { name:'Red Devils', m:'98K' }, { name:'GK Union', m:'67.8K' }].map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-surface-elevated border border-surface-border p-4">
              <div>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.m} members</p>
              </div>
              <button className="rounded-lg bg-sport-green px-3 py-1.5 text-xs font-bold text-black">Join</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Spotlight ────────────────────────────────────────────────
function SpotlightContent() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {SPOTLIGHT_FEED.map((item) => {
          const user = getFeedUser(item.handle);
          return (
            <div key={item.id} className={`relative flex aspect-[9/16] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-b ${item.gradient}`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{item.duration}</span>
                  <span className="text-[10px] text-white/60">{item.views}</span>
                </div>
                <h3 className="line-clamp-2 text-sm font-bold text-white leading-tight">{item.title}</h3>
                {user && (
                  <button onClick={() => setViewingUser(user)} className="mt-1 text-xs text-white/60 hover:text-white transition-colors">
                    {item.handle}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

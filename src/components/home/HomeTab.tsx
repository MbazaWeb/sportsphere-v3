'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNavigationStore } from '@/store/navigationStore';
import { useAppStore, getMockUser } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search, Bell, Heart, MessageCircle, Share2, Bookmark, TrendingUp, Zap, Shield } from 'lucide-react';
import type { HomeSubTab } from '@/store/navigationStore';
import { useState } from 'react';

const homeSubTabs: { id: HomeSubTab; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'trending', label: 'Trending' },
  { id: 'spotlight', label: 'Spotlight' },
];

const forYouFeed = [
  { id: 1, user: { name: 'Manchester United', handle: '@manchesterunited', avatar: 'MU', verified: true }, type: 'post' as const,
    content: 'What a performance from the lads tonight. Rashford with the brace — absolute class. Old Trafford was rocking.', time: '2m ago', likes: 4521, comments: 678, shares: 234, teamTag: 'Manchester United' },
  { id: 2, user: { name: 'SportSphere', handle: '@sportsphere', avatar: 'SS', verified: true }, type: 'post' as const,
    content: 'BREAKING: Leny Yoro completes move to Manchester United for £58.9M. The 18-year-old signs a 5-year deal.', time: '15m ago', likes: 12430, comments: 1890, shares: 3456, isBreaking: true },
  { id: 3, user: { name: 'Sarah Chen', handle: '@sarahchen', avatar: 'SC', verified: true }, type: 'photo' as const,
    content: 'Match day at the Emirates. The atmosphere was electric tonight.', time: '32m ago', likes: 3456, comments: 234, shares: 89 },
  { id: 4, user: { name: 'Football Daily', handle: '@footballdaily', avatar: 'FD', verified: true }, type: 'poll' as const,
    content: 'Who wins the Premier League this season?',
    poll: { options: [{ label: 'Manchester City', pct: 42 }, { label: 'Arsenal', pct: 31 }, { label: 'Liverpool', pct: 18 }, { label: 'Chelsea', pct: 9 }], total: 12400 },
    time: '1h ago', likes: 890, comments: 234, shares: 56 },
  { id: 5, user: { name: 'Marcus Johnson', handle: '@marcusj', avatar: 'MJ', verified: false }, type: 'post' as const,
    content: 'Haaland breaking records again. 30 goals before January is insane. The guy is on another level entirely.', time: '2h ago', likes: 890, comments: 123, shares: 67, playerTag: 'Erling Haaland' },
  { id: 6, user: { name: 'Goal Highlights HD', handle: '@goalsdaily', avatar: 'GH', verified: true }, type: 'video' as const,
    content: 'Every Rashford goal this season. Vol.1 — 12 goals, one video.', time: '3h ago', likes: 8934, comments: 456, shares: 1234 },
];

const trendingTopics = [
  { id: 1, topic: '#PremierLeague', posts: '24.5K', hot: true },
  { id: 2, topic: '#Haaland', posts: '18.2K', hot: true },
  { id: 3, topic: '#TransferWindow', posts: '15.8K', hot: false },
  { id: 4, topic: '#Arsenal', posts: '12.3K', hot: false },
  { id: 5, topic: '#AFCON2025', posts: '9.7K', hot: true },
  { id: 6, topic: '#ChampionsLeague', posts: '8.1K', hot: false },
];

const spotlightFeed = [
  { id: 1, title: 'Rashford Goal vs Wolves', creator: '@goalsdaily', views: '1.2M', duration: '0:45', gradient: 'from-green-700 to-emerald-900' },
  { id: 2, title: 'Mbappe Skills Compilation', creator: '@skillzhd', views: '890K', duration: '1:20', gradient: 'from-blue-700 to-indigo-900' },
  { id: 3, title: 'Fan Reaction — Arsenal Win', creator: '@sarahchen', views: '650K', duration: '0:30', gradient: 'from-red-700 to-rose-900' },
  { id: 4, title: 'Best Saves This Week', creator: '@gkunion', views: '430K', duration: '0:55', gradient: 'from-yellow-600 to-amber-900' },
  { id: 5, title: 'Dribble Masterclass', creator: '@techniqueking', views: '320K', duration: '1:10', gradient: 'from-purple-700 to-violet-900' },
  { id: 6, title: 'El Clasico Highlights', creator: '@laligahd', views: '2.1M', duration: '0:50', gradient: 'from-orange-600 to-red-900' },
];

export default function HomeTab() {
  const homeSubTab = useNavigationStore((s) => s.homeSubTab);
  const setHomeSubTab = useNavigationStore((s) => s.setHomeSubTab);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleNotifications = () => {
    if (!isAuthenticated) { setLoginModalOpen(true); }
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-white">SportSphere</h1>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated">
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={handleNotifications} className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sport-green" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          {homeSubTabs.map((tab) => (
            <button key={tab.id} onClick={() => setHomeSubTab(tab.id)}
              className={cn('relative rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                homeSubTab === tab.id ? 'bg-sport-green text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <motion.div key={homeSubTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {homeSubTab === 'for-you'   && <ForYouContent />}
        {homeSubTab === 'trending'  && <TrendingContent />}
        {homeSubTab === 'spotlight' && <SpotlightContent />}
      </motion.div>
    </div>
  );
}

function ForYouContent() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {forYouFeed.map((item) => <FeedCard key={item.id} item={item} />)}
    </div>
  );
}

function TrendingContent() {
  return (
    <div className="p-4 flex flex-col gap-6">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" /> Live Now
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {[
            { match: 'Man Utd 2–1 Arsenal', league: 'PL', min: '78' },
            { match: 'Real Madrid 1–1 Barca', league: 'LaLiga', min: 'HT' },
            { match: 'Inter 0–0 AC Milan', league: 'Serie A', min: '34' },
          ].map((m, i) => (
            <div key={i} className="flex-shrink-0 rounded-xl bg-surface-elevated border border-surface-border p-3 min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-red-400">{m.league} · {m.min}&apos;</span>
              </div>
              <p className="text-sm font-semibold text-white">{m.match}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-4 w-4" /> Trending
        </h2>
        <div className="flex flex-col gap-2">
          {trendingTopics.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl bg-surface-elevated border border-surface-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface">
                  {item.hot ? <Zap className="h-4 w-4 text-yellow-400" /> : <TrendingUp className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="text-sm font-semibold text-white">{item.topic}</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.posts} posts</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Communities</h2>
        <div className="flex flex-col gap-2">
          {[
            { name: 'Gooners', members: '125K' },
            { name: 'Red Devils', members: '98K' },
            { name: 'Culer Nation', members: '87K' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-surface-elevated border border-surface-border p-4">
              <p className="text-sm font-semibold text-white">{c.name} <span className="ml-1 text-xs text-muted-foreground">{c.members} members</span></p>
              <button className="rounded-lg bg-sport-green px-3 py-1.5 text-xs font-bold text-black">Join</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SpotlightContent() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {spotlightFeed.map((item) => (
          <div key={item.id} className={`relative flex aspect-[9/16] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-b ${item.gradient}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm text-white">{item.duration}</span>
                <span className="text-[10px] text-white/60">{item.views}</span>
              </div>
              <h3 className="line-clamp-2 text-sm font-bold text-white leading-tight">{item.title}</h3>
              <button onClick={() => { const u = getMockUser(item.creator); if (u) setViewingUser(u); }}
                className="mt-1 text-xs text-white/60 hover:text-white transition-colors">
                {item.creator}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedCard({ item }: { item: typeof forYouFeed[number] }) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleUserClick = () => {
    const u = getMockUser(item.user.handle);
    if (u) setViewingUser(u);
  };

  return (
    <article className="rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden">
      {'isBreaking' in item && item.isBreaking && (
        <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/10 px-4 py-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase text-red-400">Breaking News</span>
        </div>
      )}
      <div className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <button onClick={handleUserClick} className="flex items-center gap-3 text-left">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold flex-shrink-0',
              item.user.verified ? 'bg-sport-green text-black' : 'bg-surface text-white')}>
              {item.user.avatar}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white hover:underline">{item.user.name}</span>
                {item.user.verified && <Shield className="h-3.5 w-3.5 text-sport-green" />}
              </div>
              <span className="text-xs text-muted-foreground">{item.user.handle} · {item.time}</span>
            </div>
          </button>
        </div>

        <p className="mb-3 text-sm leading-relaxed text-foreground/90">{item.content}</p>

        {'teamTag' in item && item.teamTag && (
          <span className="mb-3 inline-block rounded-lg bg-sport-green/10 px-2.5 py-1 text-xs font-medium text-sport-green border border-sport-green/20">
            {item.teamTag}
          </span>
        )}
        {'playerTag' in item && item.playerTag && (
          <span className="mb-3 inline-block rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
            {item.playerTag}
          </span>
        )}

        {item.type === 'photo' && (
          <div className="mb-3 h-48 overflow-hidden rounded-xl bg-gradient-to-br from-red-800 via-red-700 to-orange-800 flex items-end p-3">
            <span className="rounded-lg bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">Emirates Stadium · Match Day</span>
          </div>
        )}

        {item.type === 'video' && (
          <div className="mb-3 h-48 overflow-hidden rounded-xl bg-gradient-to-br from-green-800 via-emerald-700 to-green-900 flex items-center justify-center relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-[14px] border-l-white" />
            </div>
            <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">2:34</span>
          </div>
        )}

        {'poll' in item && item.poll && (
          <div className="mb-3 flex flex-col gap-2">
            {item.poll.options.map((opt, i) => (
              <button key={i} className="relative overflow-hidden rounded-lg bg-surface p-3 text-left">
                <div className="absolute inset-y-0 left-0 bg-sport-green/20 rounded-lg" style={{ width: `${opt.pct}%` }} />
                <div className="relative flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{opt.label}</span>
                  <span className="text-xs font-bold text-muted-foreground">{opt.pct}%</span>
                </div>
              </button>
            ))}
            <p className="text-xs text-muted-foreground">{item.poll.total.toLocaleString()} votes</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-surface-border pt-3 mt-1">
          <button onClick={() => setLiked(!liked)} className={cn('flex items-center gap-1.5 transition-colors', liked ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400')}>
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            <span className="text-xs">{item.likes + (liked ? 1 : 0)}</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-sport-green">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{item.comments}</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-sport-green">
            <Share2 className="h-4 w-4" />
            <span className="text-xs">{item.shares}</span>
          </button>
          <button onClick={() => setSaved(!saved)} className={cn('transition-colors', saved ? 'text-sport-green' : 'text-muted-foreground hover:text-sport-green')}>
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          </button>
        </div>
      </div>
    </article>
  );
}

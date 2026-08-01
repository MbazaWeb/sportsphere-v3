'use client';

import { useAppStore, type HomeSubTab, type MockUserData, getMockUser } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search, Bell, Heart, MessageCircle, Share2, Bookmark, TrendingUp, Zap } from 'lucide-react';

const homeSubTabs: { id: HomeSubTab; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'trending', label: 'Trending' },
  { id: 'spotlight', label: 'Spotlight' },
];

// Mock data for feed
const forYouFeed = [
  {
    id: 1,
    user: { name: 'David Mbaza', handle: '@davidmbaza', avatar: 'DM' },
    type: 'post' as const,
    content: 'What a game from Manchester United! The comeback was incredible. Rashford with that brace in the second half. This season is going to be special.',
    time: '2m ago',
    likes: 234,
    comments: 45,
    shares: 12,
    teamTag: 'Manchester United',
    image: null,
  },
  {
    id: 2,
    user: { name: 'SportSphere Official', handle: '@sportsphere', avatar: 'SS' },
    type: 'post' as const,
    content: 'BREAKING: Arsenal confirms the signing of a new striker on a 5-year deal. Full announcement coming at 3 PM today.',
    time: '15m ago',
    likes: 1243,
    comments: 189,
    shares: 456,
    teamTag: 'Arsenal',
    image: null,
    isBreaking: true,
  },
  {
    id: 3,
    user: { name: 'Sarah Chen', handle: '@sarahchen', avatar: 'SC' },
    type: 'photo' as const,
    content: 'Match day vibes at the Emirates. The atmosphere was electric today.',
    time: '32m ago',
    likes: 567,
    comments: 78,
    shares: 23,
    image: 'stadium',
  },
  {
    id: 4,
    user: { name: 'Football Daily', handle: '@footballdaily', avatar: 'FD' },
    type: 'poll' as const,
    content: 'Who will win the Premier League this season?',
    time: '1h ago',
    poll: {
      options: [
        { label: 'Manchester City', votes: 42, percentage: 42 },
        { label: 'Arsenal', votes: 31, percentage: 31 },
        { label: 'Liverpool', votes: 18, percentage: 18 },
        { label: 'Chelsea', votes: 9, percentage: 9 },
      ],
      totalVotes: 12400,
    },
    likes: 89,
    comments: 234,
    shares: 56,
  },
  {
    id: 5,
    user: { name: 'Marcus Johnson', handle: '@marcusj', avatar: 'MJ' },
    type: 'post' as const,
    content: 'Haaland breaking records again. The guy is on another level. 30 goals before January is insane.',
    time: '2h ago',
    likes: 890,
    comments: 123,
    shares: 67,
    playerTag: 'Erling Haaland',
    image: null,
  },
];

const trendingFeed = [
  { id: 1, topic: '#PremierLeague', posts: '24.5K', category: 'League', hot: true },
  { id: 2, topic: '#Haaland', posts: '18.2K', category: 'Player', hot: true },
  { id: 3, topic: '#TransferWindow', posts: '15.8K', category: 'Transfers', hot: false },
  { id: 4, topic: '#Arsenal', posts: '12.3K', category: 'Team', hot: false },
  { id: 5, topic: '#AFCON2025', posts: '9.7K', category: 'Tournament', hot: true },
  { id: 6, topic: '#ChampionsLeague', posts: '8.1K', category: 'Competition', hot: false },
];

const spotlightFeed = [
  { id: 1, title: 'Rashford Goal vs Wolves', creator: '@goalsdaily', views: '1.2M', duration: '0:45', gradient: 'from-green-600 to-emerald-900' },
  { id: 2, title: 'Mbappe Skills Compilation', creator: '@skillzhd', views: '890K', duration: '1:20', gradient: 'from-blue-600 to-indigo-900' },
  { id: 3, title: 'Fan Reaction - Arsenal Win', creator: '@goonercam', views: '650K', duration: '0:30', gradient: 'from-red-600 to-rose-900' },
  { id: 4, title: 'Best Saves This Week', creator: '@gkunion', views: '430K', duration: '0:55', gradient: 'from-yellow-600 to-amber-900' },
  { id: 5, title: 'Dribble Masterclass', creator: '@techniqueking', views: '320K', duration: '1:10', gradient: 'from-purple-600 to-violet-900' },
  { id: 6, title: 'Match Highlights - El Clasico', creator: '@laligahd', views: '2.1M', duration: '0:50', gradient: 'from-orange-600 to-red-900' },
];

export default function HomeTab() {
  const homeSubTab = useAppStore((s) => s.homeSubTab);
  const setHomeSubTab = useAppStore((s) => s.setHomeSubTab);

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-white">SportSphere</h1>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated">
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sport-green" />
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 px-4 pb-2">
          {homeSubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setHomeSubTab(tab.id)}
              className={cn(
                'relative rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                homeSubTab === tab.id
                  ? 'bg-sport-green text-black'
                  : 'bg-surface text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <AnimateContent subTab={homeSubTab} />
    </div>
  );
}

function AnimateContent({ subTab }: { subTab: HomeSubTab }) {
  return (
    <motion.div
      key={subTab}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {subTab === 'for-you' && <ForYouContent />}
      {subTab === 'trending' && <TrendingContent />}
      {subTab === 'spotlight' && <SpotlightContent />}
    </motion.div>
  );
}

function ForYouContent() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {forYouFeed.map((item) => (
        <FeedCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function TrendingContent() {
  return (
    <div className="p-4">
      {/* Popular Matches */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Popular Matches</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {['Man Utd vs Arsenal', 'Real Madrid vs Barca', 'PSG vs Marseille', 'Inter vs AC Milan'].map((match, i) => (
            <div key={i} className="flex-shrink-0 rounded-xl bg-surface-elevated border border-surface-border p-3 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-sport-green animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-sport-green">Live</span>
              </div>
              <p className="text-sm font-semibold text-white">{match}</p>
              <p className="text-xs text-muted-foreground mt-1">2 - 1 &middot; 78:45</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Topics */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Trending Topics
        </h2>
        <div className="flex flex-col gap-2">
          {trendingFeed.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl bg-surface-elevated border border-surface-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
                  {item.hot && <Zap className="h-5 w-5 text-yellow-500" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.topic}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{item.posts} posts</span>
            </div>
          ))}
        </div>
      </section>

      {/* Breaking News */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Breaking News</h2>
        <div className="flex flex-col gap-2">
          {[
            { title: 'Arsenal completes major signing', time: '5m ago' },
            { title: 'Champions League draw revealed', time: '30m ago' },
            { title: 'AFCON 2025 schedule announced', time: '1h ago' },
          ].map((news, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-4">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{news.title}</p>
                <p className="text-xs text-muted-foreground">{news.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Communities */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Popular Communities</h2>
        <div className="flex flex-col gap-2">
          {[
            { name: 'Gooners', members: '125K', topic: 'Arsenal Fans' },
            { name: 'Red Devils', members: '98K', topic: 'Man Utd Fans' },
            { name: 'Culer Nation', members: '87K', topic: 'Barcelona Fans' },
          ].map((community, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-surface-elevated border border-surface-border p-4">
              <div>
                <p className="text-sm font-semibold text-white">{community.name}</p>
                <p className="text-xs text-muted-foreground">{community.members} members</p>
              </div>
              <button className="rounded-lg bg-sport-green px-3 py-1.5 text-xs font-semibold text-black">
                Join
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SpotlightContent() {
  const setViewingUser = useAppStore((s) => s.setViewingUser);

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {spotlightFeed.map((item) => (
          <div
            key={item.id}
            className={`relative flex aspect-[9/16] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-b ${item.gradient}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                  {item.duration}
                </span>
                <span className="text-[10px] text-white/60">{item.views} views</span>
              </div>
              <h3 className="line-clamp-2 text-sm font-bold text-white leading-tight">
                {item.title}
              </h3>
              <button
                onClick={() => {
                  const userData = getMockUser(item.creator);
                  if (userData) setViewingUser(userData);
                }}
                className="mt-1 text-xs text-white/60 hover:text-white transition-colors text-left"
              >
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
  const setViewingUser = useAppStore((s) => s.setViewingUser);

  const handleUserClick = () => {
    const userData = getMockUser(item.user.handle);
    if (userData) setViewingUser(userData);
  };

  return (
    <article className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
      {/* User header */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={handleUserClick} className="flex items-center gap-3 text-left active:opacity-70 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface font-bold text-sm text-sport-green">
            {item.user.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white hover:underline">{item.user.name}</span>
              {item.isBreaking && (
                <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                  BREAKING
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{item.user.handle}</span>
              <span className="text-xs text-muted-foreground">&middot;</span>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          </div>
        </button>
      </div>

      {/* Content */}
      <p className="mb-3 text-sm leading-relaxed text-foreground/90">{item.content}</p>

      {/* Tags */}
      {(item.teamTag || item.playerTag) && (
        <div className="mb-3">
          <span className="inline-block rounded-lg bg-sport-green/10 px-2.5 py-1 text-xs font-medium text-sport-green">
            {item.teamTag || item.playerTag}
          </span>
        </div>
      )}

      {/* Poll */}
      {item.type === 'poll' && 'poll' in item && item.poll && (
        <div className="mb-3 flex flex-col gap-2">
          {item.poll.options.map((option, i) => (
            <button
              key={i}
              className="relative overflow-hidden rounded-lg bg-surface p-3 text-left transition-colors hover:bg-surface/80"
            >
              <div
                className="absolute inset-y-0 left-0 bg-sport-green/20"
                style={{ width: `${option.percentage}%` }}
              />
              <div className="relative flex items-center justify-between">
                <span className="text-sm font-medium text-white">{option.label}</span>
                <span className="text-xs font-semibold text-muted-foreground">{option.percentage}%</span>
              </div>
            </button>
          ))}
          <p className="text-xs text-muted-foreground">{item.poll.totalVotes.toLocaleString()} votes</p>
        </div>
      )}

      {/* Image placeholder */}
      {item.type === 'photo' && (
        <div className="mb-3 flex h-48 items-center justify-center rounded-xl bg-surface">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">Match day photo</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-surface-border pt-3">
        <button className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-sport-green">
          <Heart className="h-4 w-4" />
          <span className="text-xs">{item.likes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-sport-green">
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{item.comments}</span>
        </button>
        <button className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-sport-green">
          <Share2 className="h-4 w-4" />
          <span className="text-xs">{item.shares}</span>
        </button>
        <button className="text-muted-foreground transition-colors hover:text-sport-green">
          <Bookmark className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

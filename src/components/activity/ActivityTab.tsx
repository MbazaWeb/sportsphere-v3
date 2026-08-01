'use client';

import { useAppStore, type ActivitySubTab } from '@/store/useAppStore';
import { useUIStore } from '@/store/uiStore';
import { getFeedUser } from '@/data/feedData';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Heart, UserPlus, MessageCircle, Circle, Trophy,
  Users, Bell, ChevronRight, X, Flame, Crown,
} from 'lucide-react';

const activitySubTabs: { id: ActivitySubTab; label: string; badge?: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'social',   label: 'Social' },
  { id: 'sports',   label: 'Sports' },
  { id: 'messages', label: 'Messages', badge: '3' },
];

// Each activity item now carries a `handle` for clickable user
const allActivity = [
  { id: 1,  type: 'like',        handle: '@davidmbaza',    avatar: 'DM', text: 'David liked your post about Manchester United',    time: '2m ago',  read: false },
  { id: 2,  type: 'goal',        handle: '@manchesterunited', avatar: 'MU', text: 'GOAL! Rashford makes it 2-1 — Man Utd vs Arsenal', time: '5m ago',  read: false },
  { id: 3,  type: 'follow',      handle: '@sarahchen',     avatar: 'SC', text: 'Sarah Chen started following you',                 time: '15m ago', read: false },
  { id: 4,  type: 'prediction',  handle: null,             avatar: '🎯', text: 'Your prediction was correct! Arsenal won 2-1',     time: '30m ago', read: false },
  { id: 5,  type: 'community',   handle: null,             avatar: 'GN', text: 'You were invited to join "Gooners" community',     time: '1h ago',  read: true  },
  { id: 6,  type: 'result',      handle: null,             avatar: '⚽', text: 'Chelsea vs Liverpool ended 1-3',                   time: '2h ago',  read: true  },
  { id: 7,  type: 'comment',     handle: '@marcusj',       avatar: 'MJ', text: 'Marcus commented: "Great analysis!"',             time: '3h ago',  read: true  },
  { id: 8,  type: 'transfer',    handle: '@footballdaily', avatar: 'FD', text: 'Transfer news: Arsenal signs new midfielder',       time: '5h ago',  read: true  },
  { id: 9,  type: 'poll_result', handle: null,             avatar: '📊', text: 'Poll results: 42% voted Manchester City to win',   time: '6h ago',  read: true  },
  { id: 10, type: 'follow',      handle: '@goalsdaily',    avatar: 'GH', text: 'Goal Highlights HD started following you',         time: '8h ago',  read: true  },
];

const socialActivity = allActivity.filter(a => ['like','follow','comment'].includes(a.type));
const sportsActivity  = allActivity.filter(a => ['goal','prediction','result','transfer','poll_result'].includes(a.type));

const messageChats = [
  { id: 1, handle: '@davidmbaza',    name: 'David Mbaza',          avatar: 'DM', lastMessage: 'Did you see that game?',          time: '2m',  unread: 2 },
  { id: 2, handle: '@sarahchen',     name: 'Sarah Chen',           avatar: 'SC', lastMessage: "Let's go to the match together!", time: '15m', unread: 1 },
  { id: 3, handle: '@goonercam',     name: 'Gooners Community',    avatar: 'GC', lastMessage: 'Admin: Match day thread is up',   time: '1h',  unread: 0, isGroup: true },
  { id: 4, handle: '@marcusj',       name: 'Marcus Johnson',       avatar: 'MJ', lastMessage: 'Great prediction!',               time: '3h',  unread: 0 },
  { id: 5, handle: '@manchesterunited', name: 'Man Utd vs Arsenal', avatar: 'MU', lastMessage: 'John: What a comeback!',         time: '5h',  unread: 0, isMatch: true },
];

function getActivityIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    like:        <Heart className="h-4 w-4 text-pink-400" />,
    follow:      <UserPlus className="h-4 w-4 text-blue-400" />,
    goal:        <Circle className="h-4 w-4 text-gold" />,
    prediction:  <Trophy className="h-4 w-4 text-yellow-400" />,
    community:   <Users className="h-4 w-4 text-purple-400" />,
    result:      <Bell className="h-4 w-4 text-muted-foreground" />,
    comment:     <MessageCircle className="h-4 w-4 text-cyan-400" />,
    transfer:    <ChevronRight className="h-4 w-4 text-orange-400" />,
    poll_result: <Bell className="h-4 w-4 text-muted-foreground" />,
  };
  return map[type] ?? <Bell className="h-4 w-4 text-muted-foreground" />;
}

export default function ActivityTab() {
  const isAuthenticated   = useAppStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useAppStore((s) => s.setLoginModalOpen);
  const activitySubTab    = useAppStore((s) => s.activitySubTab);
  const setActivitySubTab = useAppStore((s) => s.setActivitySubTab);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 pt-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm glass-card rounded-3xl p-8 text-center glass-card-hover">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
            <Bell className="h-8 w-8 text-gold" />
          </div>
          <h2 className="mb-2 text-xl font-black text-white">Activity Feed</h2>
          <p className="mb-8 text-sm text-muted-foreground">Sign in to see likes, follows, match alerts and messages.</p>
          <button onClick={() => setLoginModalOpen(true)}
            className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors shadow-[0_4px_20px_rgba(245,197,24,0.2)]">
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-black text-gold-gradient">Activity</h1>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 pb-2">
          {activitySubTabs.map((tab) => (
            <button key={tab.id} onClick={() => setActivitySubTab(tab.id)}
              className={cn('relative flex-shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors',
                activitySubTab === tab.id ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
              {tab.label}
              {tab.badge && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <motion.div key={activitySubTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {activitySubTab === 'all'      && <ActivityList items={allActivity} />}
        {activitySubTab === 'social'   && <ActivityList items={socialActivity} />}
        {activitySubTab === 'sports'   && <ActivityList items={sportsActivity} />}
        {activitySubTab === 'messages' && <MessagesList />}
      </motion.div>
    </div>
  );
}

function ActivityList({ items }: { items: typeof allActivity }) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  return (
    <div className="p-4 flex flex-col gap-2">
      {items.map((item) => {
        const user = item.handle ? getFeedUser(item.handle) : null;
        const isClickable = !!user;

        const content = (
          <div className={cn('glass-card rounded-2xl p-4 transition-colors',
            !item.read ? 'border-gold/20' : '',
            isClickable && 'glass-card-hover cursor-pointer')}>
            <div className="flex items-start gap-3">
              <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                !item.read ? 'bg-gold/10' : 'bg-surface/50')}>
                {user ? (
                  <span className={cn('text-sm font-bold', user.verified ? 'text-gold' : 'text-white')}>
                    {user.avatar}
                  </span>
                ) : (
                  getActivityIcon(item.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm leading-relaxed', !item.read ? 'text-white font-medium' : 'text-foreground/70')}>
                  {item.text}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
              </div>
              {!item.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gold animate-pulse" />}
            </div>
          </div>
        );

        return isClickable ? (
          <button key={item.id} onClick={() => setViewingUser(user!)} className="w-full text-left">
            {content}
          </button>
        ) : (
          <div key={item.id}>{content}</div>
        );
      })}
    </div>
  );
}

function MessagesList() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  return (
    <div className="p-4 flex flex-col gap-2">
      <div className="mb-2 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-gold" />
        <span className="text-xs font-bold text-gold uppercase tracking-wider">Conversations</span>
      </div>
      {messageChats.map((chat) => {
        const user = getFeedUser(chat.handle);
        return (
          <button key={chat.id} onClick={() => { if (user) setViewingUser(user); }}
            className="glass-card rounded-2xl p-3 text-left glass-card-hover w-full">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 font-bold text-sm text-gold">
                {chat.avatar}
                {chat.isGroup && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface-elevated border border-surface-border">
                    <Users className="h-2.5 w-2.5 text-muted-foreground" />
                  </span>
                )}
                {chat.unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
                    {chat.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-bold text-white truncate">{chat.name}</p>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{chat.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

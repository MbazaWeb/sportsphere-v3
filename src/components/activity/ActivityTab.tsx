'use client';

import { useAppStore, type ActivitySubTab, getMockUser } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Heart, UserPlus, MessageCircle, Star, Circle, Clock, Bell, Users, Trophy, ChevronRight, X, Square } from 'lucide-react';

const activitySubTabs: { id: ActivitySubTab; label: string; badge?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'sports', label: 'Sports' },
  { id: 'messages', label: 'Messages', badge: '3' },
];

const allActivity = [
  { id: 1, type: 'like' as const, text: 'David liked your post about Manchester United', time: '2m ago', read: false },
  { id: 2, type: 'goal' as const, text: 'GOAL! Manchester United score! Rashford makes it 2-1', time: '5m ago', read: false },
  { id: 3, type: 'follow' as const, text: 'Sarah Chen started following you', time: '15m ago', read: false },
  { id: 4, type: 'prediction' as const, text: 'Your prediction was correct! Arsenal won 2-1', time: '30m ago', read: false },
  { id: 5, type: 'community' as const, text: 'You were invited to join "Gooners" community', time: '1h ago', read: true },
  { id: 6, type: 'result' as const, text: 'Chelsea vs Liverpool ended 1-3', time: '2h ago', read: true },
  { id: 7, type: 'comment' as const, text: 'Marcus commented on your post: "Great analysis!"', time: '3h ago', read: true },
  { id: 8, type: 'redcard' as const, text: 'Red card! Arsenal player sent off in the 67th minute', time: '3h ago', read: true },
  { id: 9, type: 'transfer' as const, text: 'Transfer news: Arsenal signs new midfielder', time: '5h ago', read: true },
  { id: 10, type: 'poll_result' as const, text: 'Poll results are in: 42% voted Manchester City', time: '6h ago', read: true },
];

const socialActivity = [
  { id: 1, type: 'like' as const, text: 'David liked your post about Manchester United', time: '2m ago', read: false },
  { id: 3, type: 'follow' as const, text: 'Sarah Chen started following you', time: '15m ago', read: false },
  { id: 5, type: 'community' as const, text: 'You were invited to join "Gooners" community', time: '1h ago', read: true },
  { id: 7, type: 'comment' as const, text: 'Marcus commented on your post: "Great analysis!"', time: '3h ago', read: true },
  { id: 11, type: 'like' as const, text: 'Jane liked your photo', time: '4h ago', read: true },
  { id: 12, type: 'follow' as const, text: 'Football Daily started following you', time: '8h ago', read: true },
];

const sportsActivity = [
  { id: 2, type: 'goal' as const, text: 'GOAL! Manchester United score! Rashford makes it 2-1', time: '5m ago', read: false },
  { id: 4, type: 'prediction' as const, text: 'Your prediction was correct! Arsenal won 2-1', time: '30m ago', read: false },
  { id: 6, type: 'result' as const, text: 'Chelsea vs Liverpool ended 1-3', time: '2h ago', read: true },
  { id: 8, type: 'redcard' as const, text: 'Red card! Arsenal player sent off in the 67th minute', time: '3h ago', read: true },
  { id: 9, type: 'transfer' as const, text: 'Transfer news: Arsenal signs new midfielder', time: '5h ago', read: true },
];

const messageChats = [
  { id: 1, name: 'David Mbaza', lastMessage: 'Did you see that game?', time: '2m', unread: 2, avatar: 'DM' },
  { id: 2, name: 'Sarah Chen', lastMessage: 'Let\'s go to the match together!', time: '15m', unread: 1, avatar: 'SC' },
  { id: 3, name: 'Gooners Community', lastMessage: 'Admin: Match day thread is up', time: '1h', unread: 0, avatar: 'GC', isGroup: true },
  { id: 4, name: 'Marcus Johnson', lastMessage: 'Great prediction!', time: '3h', unread: 0, avatar: 'MJ' },
  { id: 5, name: 'Man Utd vs Arsenal Chat', lastMessage: 'John: What a comeback!', time: '5h', unread: 0, avatar: 'MU', isMatch: true },
];

function getActivityIcon(type: string) {
  switch (type) {
    case 'like': return <Heart className="h-4 w-4 text-pink-400" />;
    case 'follow': return <UserPlus className="h-4 w-4 text-blue-400" />;
    case 'goal': return <Circle className="h-4 w-4 text-sport-green" />;
    case 'redcard': return <Square className="h-4 w-4 text-red-400" />;
    case 'prediction': return <Trophy className="h-4 w-4 text-yellow-400" />;
    case 'community': return <Users className="h-4 w-4 text-purple-400" />;
    case 'comment': return <MessageCircle className="h-4 w-4 text-cyan-400" />;
    case 'result': return <Star className="h-4 w-4 text-orange-400" />;
    case 'transfer': return <Bell className="h-4 w-4 text-emerald-400" />;
    case 'poll_result': return <Star className="h-4 w-4 text-blue-400" />;
    default: return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function getIconBg(type: string) {
  const map: Record<string, string> = {
    like: 'bg-pink-500/10',
    follow: 'bg-blue-500/10',
    goal: 'bg-green-500/10',
    redcard: 'bg-red-500/10',
    prediction: 'bg-yellow-500/10',
    community: 'bg-purple-500/10',
    comment: 'bg-cyan-500/10',
    result: 'bg-orange-500/10',
    transfer: 'bg-emerald-500/10',
    poll_result: 'bg-blue-500/10',
  };
  return map[type] || 'bg-surface';
}

export default function ActivityTab() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useAppStore((s) => s.setLoginModalOpen);
  const setLoginTrigger = useAppStore((s) => s.setLoginTrigger);
  const activitySubTab = useAppStore((s) => s.activitySubTab);
  const setActivitySubTab = useAppStore((s) => s.setActivitySubTab);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-3xl bg-surface-elevated border border-surface-border p-8 text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sport-green/10">
            <Bell className="h-8 w-8 text-sport-green" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">Join SportSphere</h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Stay connected with your favorite teams, players and communities.
          </p>

          <div className="mb-6 text-left space-y-2">
            {[
              'Match updates',
              'Likes & comments',
              'New followers',
              'Messages',
              'Transfer news',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-sport-green text-sm">&#10003;</span>
                <span className="text-sm text-foreground/80">{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setLoginTrigger('activity');
              setLoginModalOpen(true);
            }}
            className="w-full rounded-xl bg-sport-green py-3 text-sm font-bold text-black hover:bg-sport-green/90 transition-colors"
          >
            Join Now
          </button>

          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => {
                setLoginTrigger('activity');
                setLoginModalOpen(true);
              }}
              className="text-sport-green font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-white">Activity</h1>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 pb-2">
          {activitySubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivitySubTab(tab.id)}
              className={cn(
                'flex-shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors relative',
                activitySubTab === tab.id
                  ? 'bg-sport-green text-black'
                  : 'bg-surface text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.badge && activitySubTab !== tab.id && (
                <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <motion.div
        key={activitySubTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activitySubTab === 'all' && <ActivityList items={allActivity} />}
        {activitySubTab === 'social' && <ActivityList items={socialActivity} />}
        {activitySubTab === 'sports' && <ActivityList items={sportsActivity} />}
        {activitySubTab === 'messages' && <MessagesList />}
      </motion.div>
    </div>
  );
}

function ActivityList({ items }: { items: typeof allActivity }) {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-3 rounded-xl p-3 transition-colors',
              item.read ? 'bg-transparent' : 'bg-surface-elevated/50'
            )}
          >
            <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', getIconBg(item.type))}>
              {getActivityIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm leading-snug',
                item.read ? 'text-muted-foreground' : 'text-foreground/90'
              )}>
                {item.text}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
            </div>
            {!item.read && (
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-sport-green" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesList() {
  const setViewingUser = useAppStore((s) => s.setViewingUser);

  return (
    <div className="p-4">
      <div className="flex flex-col gap-2">
        {messageChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => {
              const handle = `@${chat.avatar.toLowerCase()}`;
              const userData = getMockUser(handle);
              if (userData) setViewingUser(userData);
            }}
            className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3 text-left transition-colors hover:bg-surface active:opacity-70"
          >
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-surface font-bold text-sm text-sport-green">
              {chat.avatar}
              {(chat.isGroup || chat.isMatch) && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface-elevated">
                  {chat.isGroup ? <Users className="h-2.5 w-2.5 text-muted-foreground" /> : <Circle className="h-2.5 w-2.5 text-muted-foreground" />}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white truncate">{chat.name}</p>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{chat.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                {chat.unread > 0 && (
                  <span className="ml-2 flex h-4 min-w-[16px] flex-shrink-0 items-center justify-center rounded-full bg-sport-green px-1 text-[10px] font-bold text-black">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useAppStore, type ActivitySubTab } from '@/store/useAppStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Heart, UserPlus, MessageCircle, Circle, Trophy,
  Users, Bell, ChevronRight, X, Flame, Crown,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const activitySubTabs: { id: ActivitySubTab; label: string; badge?: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'social',   label: 'Social' },
  { id: 'sports',   label: 'Sports' },
  { id: 'messages', label: 'Messages', badge: '3' },
];

// --- Shared time formatters (outside components to avoid React purity issues) ---
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatTimeShort(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

// --- Types from API ---
interface ApiNotification {
  id: string; type: string; title: string; body: string | null;
  isRead: boolean; actorId: string | null; referenceId: string | null;
  createdAt: string;
  actor?: { id: string; name: string; handle: string; avatarInitials: string; isVerified: boolean } | null;
}

interface ApiMessageConversation {
  partnerId: string; partnerName: string; partnerHandle: string;
  partnerAvatar: string; lastMessage: string; lastTime: string;
  unread: number; isVerified: boolean;
}

interface ActivityItem {
  id: string; type: string; handle: string | null; avatar: string;
  text: string; time: string; read: boolean;
}

function getActivityIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    like:        <Heart className="h-4 w-4 text-pink-400" />,
    follow:      <UserPlus className="h-4 w-4 text-blue-400" />,
    goal:        <Circle className="h-4 w-4 text-gold" />,
    match_goal:  <Circle className="h-4 w-4 text-gold" />,
    prediction:  <Trophy className="h-4 w-4 text-yellow-400" />,
    community:   <Users className="h-4 w-4 text-purple-400" />,
    result:      <Bell className="h-4 w-4 text-muted-foreground" />,
    comment:     <MessageCircle className="h-4 w-4 text-cyan-400" />,
    transfer:    <ChevronRight className="h-4 w-4 text-orange-400" />,
    poll_result: <Bell className="h-4 w-4 text-muted-foreground" />,
    system:      <Bell className="h-4 w-4 text-muted-foreground" />,
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
        {activitySubTab === 'all'      && <ActivityList filter="all" />}
        {activitySubTab === 'social'   && <ActivityList filter="social" />}
        {activitySubTab === 'sports'   && <ActivityList filter="sports" />}
        {activitySubTab === 'messages' && <MessagesList />}
      </motion.div>
    </div>
  );
}

// --- ActivityList with API fetch ---
function ActivityList({ filter }: { filter: 'all' | 'social' | 'sports' }) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/activity');
        if (res.ok) {
          const data = await res.json();
          const notifs: ActivityItem[] = (data.notifications || []).map((n: ApiNotification) => ({
            id: n.id,
            type: n.type,
            handle: n.actor?.handle || null,
            avatar: n.actor?.avatarInitials || '🎯',
            text: n.title,
            time: formatTime(n.createdAt),
            read: n.isRead,
          }));

          const filtered = filter === 'all'
            ? notifs
            : filter === 'social'
            ? notifs.filter((a: ActivityItem) => ['like', 'follow', 'comment'].includes(a.type))
            : notifs.filter((a: ActivityItem) => ['goal', 'match_goal', 'prediction', 'result', 'transfer', 'poll_result'].includes(a.type));

          setItems(filtered);
        }
      } catch (e) { /* empty */ }
      setLoading(false);
    }
    loadData();
  }, [filter]);

  const handleUserClick = useCallback(async (item: ActivityItem) => {
    if (!item.handle) return;
    try {
      const res = await fetch(`/api/users?handle=${encodeURIComponent(item.handle)}`);
      if (res.ok) {
        const u = await res.json();
        const { apiUserToViewing } = await import('@/types');
        setViewingUser(apiUserToViewing(u, false));
        return;
      }
    } catch { /* noop */ }
    // Fallback
    setViewingUser({
      id: item.handle, name: item.text.split(' ').slice(0, 2).join(' '),
      handle: item.handle, avatar: typeof item.avatar === 'string' ? item.avatar : '??',
      verified: false, coverGradient: 'from-surface to-surface',
      bio: '', role: 'User', location: '', joined: '',
      followers: 0, following: 0, posts: 0, isFollowing: false,
    });
  }, [setViewingUser]);

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-surface animate-pulse" />
              <div className="flex-1">
                <div className="h-3 w-full rounded bg-surface animate-pulse mb-1" />
                <div className="h-2 w-16 rounded bg-surface animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-2">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
        </div>
      ) : items.map((item) => {
        const isClickable = !!item.handle;

        const content = (
          <div className={cn('glass-card rounded-2xl p-4 transition-colors',
            !item.read ? 'border-gold/20' : '',
            isClickable && 'glass-card-hover cursor-pointer')}>
            <div className="flex items-start gap-3">
              <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                !item.read ? 'bg-gold/10' : 'bg-surface/50')}>
                {isClickable ? (
                  <span className="text-sm font-bold text-gold">
                    {item.avatar}
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
          <button key={item.id} onClick={() => handleUserClick(item)} className="w-full text-left">
            {content}
          </button>
        ) : (
          <div key={item.id}>{content}</div>
        );
      })}
    </div>
  );
}

// --- MessagesList with API fetch ---
function MessagesList() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [conversations, setConversations] = useState<ApiMessageConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (e) { /* empty */ }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleChatClick = async (chat: ApiMessageConversation) => {
    try {
      const res = await fetch(`/api/users?handle=${encodeURIComponent(chat.partnerHandle)}`);
      if (res.ok) {
        const u = await res.json();
        const { apiUserToViewing } = await import('@/types');
        setViewingUser(apiUserToViewing(u, false));
        return;
      }
    } catch { /* noop */ }
    // Fallback with data from message conversation
    setViewingUser({
      id: chat.partnerId, name: chat.partnerName, handle: chat.partnerHandle,
      avatar: chat.partnerAvatar, verified: chat.isVerified,
      coverGradient: 'from-surface-elevated to-surface',
      bio: '', role: 'User', location: '', joined: '',
      followers: 0, following: 0, posts: 0, isFollowing: false,
    });
  };

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-surface animate-pulse" />
              <div className="flex-1">
                <div className="h-3 w-24 rounded bg-surface animate-pulse mb-1" />
                <div className="h-2 w-32 rounded bg-surface animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-2">
      <div className="mb-2 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-gold" />
        <span className="text-xs font-bold text-gold uppercase tracking-wider">Conversations</span>
      </div>
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No conversations yet</p>
        </div>
      ) : conversations.map((chat) => (
        <button key={chat.partnerId} onClick={() => handleChatClick(chat)}
          className="glass-card rounded-2xl p-3 text-left glass-card-hover w-full">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 font-bold text-sm text-gold">
              {chat.partnerAvatar}
              {chat.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
                  {chat.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-bold text-white truncate">{chat.partnerName}</p>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatTimeShort(chat.lastTime)}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

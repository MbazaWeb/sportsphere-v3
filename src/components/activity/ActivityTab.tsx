'use client';
import { apiFetch } from '@/lib/api';

import { useAppStore, type ActivitySubTab } from '@/store/useAppStore';
import { useUIStore } from '@/store/uiStore';
import { formatTime, formatTimeShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Heart, UserPlus, MessageCircle, Circle, Trophy,
  Users, Bell, ChevronRight, X,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const activitySubTabs: { id: ActivitySubTab; label: string; icon: React.ElementType }[] = [
  { id: 'all',      label: 'All',       icon: Bell },
  { id: 'social',   label: 'Social',    icon: Heart },
  { id: 'sports',   label: 'Sports',    icon: Trophy },
  { id: 'messages', label: 'Messages',  icon: MessageCircle },
];

// --- Types ---
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
      <div className="flex flex-col items-center justify-center px-6 pt-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm glass-card rounded-3xl p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20">
            <Bell className="h-8 w-8 text-gold" />
          </div>
          <h2 className="mb-2 text-xl font-black text-white">Activity Feed</h2>
          <p className="mb-8 text-sm text-muted-foreground leading-relaxed">Sign in to see likes, follows, match alerts and messages.</p>
          <button onClick={() => setLoginModalOpen(true)}
            className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors shadow-[0_4px_20px_rgba(245,197,24,0.2)]">
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-surface-border/60 bg-background/80 backdrop-blur-2xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-extrabold text-foreground tracking-tight">Activity</h1>
        </div>
        <div className="flex gap-1 px-4 pb-2.5">
          {activitySubTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActivitySubTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-1.5 flex-shrink-0 rounded-lg px-3.5 py-1.5 text-[12px] font-bold transition-all duration-200',
                  activitySubTab === tab.id
                    ? 'bg-gold text-black shadow-sm shadow-gold/20'
                    : 'text-muted-foreground hover:text-foreground active:scale-95'
                )}>
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
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

// --- ActivityList ---
function ActivityList({ filter }: { filter: 'all' | 'social' | 'sports' }) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch('/api/activity');
        if (res.ok) {
          const data = await res.json();
          const notifs: ActivityItem[] = (data.notifications || []).map((n: ApiNotification) => ({
            id: n.id, type: n.type,
            handle: n.actor?.handle || null,
            avatar: n.actor?.avatarInitials || '🎯',
            text: n.title, time: formatTime(n.createdAt), read: n.isRead,
          }));
          const filtered = filter === 'all'
            ? notifs
            : filter === 'social'
            ? notifs.filter((a: ActivityItem) => ['like', 'follow', 'comment'].includes(a.type))
            : notifs.filter((a: ActivityItem) => ['goal', 'match_goal', 'prediction', 'result', 'transfer', 'poll_result'].includes(a.type));
          setItems(filtered);
        }
      } catch { }
      setLoading(false);
    }
    loadData();
  }, [filter]);

  const handleUserClick = useCallback(async (item: ActivityItem) => {
    if (!item.handle) return;
    try {
      const res = await apiFetch(`/api/users?handle=${encodeURIComponent(item.handle)}`);
      if (res.ok) {
        const u = await res.json();
        const { apiUserToViewing } = await import('@/types');
        setViewingUser(apiUserToViewing(u, false));
      }
    } catch { }
  }, [setViewingUser]);

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-surface-border/60 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-surface animate-pulse" />
              <div className="flex-1">
                <div className="h-3 w-full rounded bg-surface animate-pulse mb-1.5" />
                <div className="h-2 w-16 rounded bg-surface animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-2.5">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          {filter === 'social' ? <Users className="h-10 w-10 text-muted-foreground/20 mb-3" /> :
           filter === 'sports' ? <Trophy className="h-10 w-10 text-muted-foreground/20 mb-3" /> :
           <Bell className="h-10 w-10 text-muted-foreground/20 mb-3" />}
          <p className="text-sm font-semibold text-muted-foreground">
            {filter === 'social' ? 'No social activity yet' :
             filter === 'sports' ? 'No sports updates yet' :
             'No activity yet'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Check back later</p>
        </div>
      ) : items.map((item) => {
        const isClickable = !!item.handle;
        const content = (
          <div className={cn(
            'rounded-2xl border p-4 transition-all duration-200',
            !item.read ? 'border-gold/15 bg-gold/[0.02]' : 'border-surface-border/60 bg-surface/30',
            isClickable && 'hover:bg-surface-elevated/50 cursor-pointer'
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors',
                !item.read ? 'bg-gold/10' : 'bg-surface/60'
              )}>
                {isClickable ? (
                  <span className="text-sm font-bold text-gold">{item.avatar}</span>
                ) : (
                  getActivityIcon(item.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[13px] leading-relaxed', !item.read ? 'text-white font-medium' : 'text-foreground/70')}>
                  {item.text}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{item.time}</p>
              </div>
              {!item.read && <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-gold" />}
            </div>
          </div>
        );
        return isClickable ? (
          <button key={item.id} onClick={() => handleUserClick(item)} className="w-full text-left">{content}</button>
        ) : (
          <div key={item.id}>{content}</div>
        );
      })}
    </div>
  );
}

// --- MessagesList ---
function MessagesList() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [conversations, setConversations] = useState<ApiMessageConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch('/api/messages');
        if (res.ok) { setConversations(await res.json()); }
      } catch { }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleChatClick = async (chat: ApiMessageConversation) => {
    try {
      const res = await apiFetch(`/api/users?handle=${encodeURIComponent(chat.partnerHandle)}`);
      if (res.ok) {
        const u = await res.json();
        const { apiUserToViewing } = await import('@/types');
        setViewingUser(apiUserToViewing(u, false));
      }
    } catch { }
  };

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-surface-border/60 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-surface animate-pulse" />
              <div className="flex-1">
                <div className="h-3 w-24 rounded bg-surface animate-pulse mb-1.5" />
                <div className="h-2 w-32 rounded bg-surface animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-2.5">
      <div className="mb-1 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-gold" />
        <span className="text-[11px] font-bold text-gold uppercase tracking-wider">Conversations</span>
      </div>
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <MessageCircle className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No conversations yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Start a chat from someone's profile</p>
        </div>
      ) : conversations.map((chat) => (
        <button key={chat.partnerId} onClick={() => handleChatClick(chat)}
          className="rounded-2xl border border-surface-border/60 bg-surface/30 p-3.5 text-left hover:bg-surface-elevated/50 transition-all duration-200 w-full">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 font-bold text-sm text-gold">
              {chat.partnerAvatar}
              {chat.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black shadow-sm">
                  {chat.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[13px] font-bold text-white truncate">{chat.partnerName}</p>
                <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{formatTimeShort(chat.lastTime)}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

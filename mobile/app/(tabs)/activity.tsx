/**
 * Activity Screen — matches web ActivityTab exactly
 * -----------------------------------------------
 * - Header with "Activity" title (gold gradient text)
 * - Sub-tabs: All, Social, Sports, Messages (gold active chip)
 * - Activity items: glass cards with icon, avatar, text, time, unread dot
 * - Messages: conversation list with avatar, name, last message, unread badge
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Heart, MessageCircle, UserPlus, AtSign, Bell, Trophy, ShieldCheck,
} from 'lucide-react-native';

import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { notificationsApi } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import type { Notification as NotificationItem } from '@sportsphere/api-client';
import type { ApiError } from '@sportsphere/api-client';

const GOLD = '#F5C518';
const BG = '#0A1628';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

type ActivitySubTab = 'all' | 'social' | 'sports' | 'messages';

const SUB_TABS: { id: ActivitySubTab; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'social',   label: 'Social' },
  { id: 'sports',   label: 'Sports' },
  { id: 'messages', label: 'Messages' },
];

const ICON_MAP: Record<string, { Icon: any; color: string; bg: string }> = {
  follow:        { Icon: UserPlus,      color: GOLD, bg: 'rgba(245, 197, 24, 0.10)' },
  like:          { Icon: Heart,         color: '#FF453A', bg: 'rgba(255, 69, 58, 0.10)' },
  comment:       { Icon: MessageCircle, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.10)' },
  reply:         { Icon: MessageCircle, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.10)' },
  mention:       { Icon: AtSign,        color: '#FF6B35', bg: 'rgba(255, 107, 53, 0.10)' },
  verification:  { Icon: ShieldCheck,   color: '#22C55E', bg: 'rgba(34, 197, 94, 0.10)' },
  rank_change:   { Icon: Trophy,        color: GOLD, bg: 'rgba(245, 197, 24, 0.10)' },
  system:        { Icon: Bell,          color: MUTED, bg: SURFACE },
};

export default function ActivityScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<ActivitySubTab>('all');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const list = await notificationsApi.list();
      setItems(list);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Failed to load notifications');
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) load();
    else setLoading(false);
  }, [session, load]);

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.wordmark, styles.goldGradientText]}>Activity</Text>
        </View>
        <View style={styles.signInWrap}>
          <GlassCard elevated style={styles.signInCard}>
            <Bell size={32} color={GOLD} />
            <Text style={styles.signInTitle}>Sign in to see your activity</Text>
            <Text style={styles.signInBody}>
              Get notified when someone follows you, likes your posts, or comments on your predictions.
            </Text>
            <Pressable style={styles.signInButton} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInButtonText}>Sign in</Text>
            </Pressable>
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with gold gradient Activity title */}
      <View style={styles.header}>
        <Text style={[styles.wordmark, styles.goldGradientText]}>Activity</Text>
      </View>

      {/* Sub-tabs: All, Social, Sports, Messages */}
      <View style={styles.tabsRow}>
        {SUB_TABS.map((tab) => {
          const isActive = activeSub === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveSub(tab.id)}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
            >
              <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Messages tab shows conversation list */}
      {activeSub === 'messages' ? (
        <View style={styles.listContent}>
          {MOCK_CONVERSATIONS.map((conv) => (
            <GlassCard key={conv.id} style={styles.convCard}>
              <Avatar url={conv.avatarUrl} size={44} goldRing={conv.verified} />
              <View style={styles.convMeta}>
                <View style={styles.convTopRow}>
                  <Text style={styles.convName} numberOfLines={1}>{conv.name}</Text>
                  <Text style={styles.convTime}>{conv.time}</Text>
                </View>
                <Text style={styles.convMessage} numberOfLines={1}>{conv.lastMessage}</Text>
              </View>
              {conv.unread > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{conv.unread}</Text>
                </View>
              ) : null}
            </GlassCard>
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationRow item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={GOLD} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}><ActivityIndicator color={GOLD} size="large" /></View>
            ) : error ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Couldn't load notifications</Text>
                <Text style={styles.emptyBody}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={() => load()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </GlassCard>
            ) : (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>You're all caught up</Text>
                <Text style={styles.emptyBody}>
                  Notifications about new followers, likes, and mentions will appear here.
                </Text>
              </GlassCard>
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const config = ICON_MAP[item.type] ?? ICON_MAP.system;
  const { Icon, color, bg } = config;

  return (
    <GlassCard style={[styles.row, !item.isRead && styles.rowUnread] as any}>
      <View style={[styles.iconWrap, { backgroundColor: bg }] as any}>
        <Icon size={18} color={color} />
      </View>
      <View style={styles.rowMeta}>
        <View style={styles.actorRow}>
          {item.actor ? (
            <Avatar url={item.actor.avatarUrl ?? undefined} size={20} />
          ) : null}
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {!item.isRead ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.timestamp}>{formatRelative(item.createdAt)}</Text>
      </View>
    </GlassCard>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const sec = Math.max(1, Math.floor((now - then) / 1000));
  if (sec < 60)    return `${sec}s ago`;
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const MOCK_CONVERSATIONS = [
  { id: '1', name: 'Marcus Johnson', avatarUrl: undefined, lastMessage: 'Great prediction on the EPL final! 🔥', time: '2m', unread: 3, verified: true },
  { id: '2', name: 'Sarah Kim', avatarUrl: undefined, lastMessage: 'Did you see the Champions League draw?', time: '15m', unread: 0, verified: false },
  { id: '3', name: 'James Okafor', avatarUrl: undefined, lastMessage: 'Let me know when you\'re free to watch the match', time: '1h', unread: 1, verified: false },
  { id: '4', name: 'Emma Williams', avatarUrl: undefined, lastMessage: 'That analysis was spot on 👏', time: '3h', unread: 0, verified: true },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  wordmark: {
    fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: '700', color: FG, letterSpacing: -0.5,
  },
  goldGradientText: {
    // Approximation: use gold color since RN can't do CSS gradient text easily
    color: GOLD,
  },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  tabChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
  },
  tabChipActive: { backgroundColor: GOLD, borderColor: GOLD },
  tabChipText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, fontWeight: '600' },
  tabChipTextActive: { fontFamily: FONT_BODY_BOLD, fontSize: 13, color: '#0A1628', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14,
  },
  rowUnread: { borderColor: 'rgba(245, 197, 24, 0.20)' },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  rowMeta: { flex: 1, gap: 4 },
  actorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: {
    flex: 1, fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: FG,
  },
  body: { fontFamily: FONT_BODY_REG, fontSize: 13, lineHeight: 18, color: MUTED },
  timestamp: { fontFamily: FONT_BODY_REG, fontSize: 11, color: MUTED, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD },

  // Conversation list (messages tab)
  convCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8,
  },
  convMeta: { flex: 1, gap: 4 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontFamily: FONT_BODY_BOLD, fontSize: 15, fontWeight: '700', color: FG, flex: 1 },
  convTime: { fontFamily: FONT_BODY_REG, fontSize: 12, color: MUTED },
  convMessage: { fontFamily: FONT_BODY_REG, fontSize: 13, color: MUTED },
  unreadBadge: {
    backgroundColor: GOLD, borderRadius: 999,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  unreadBadgeText: { fontFamily: FONT_BODY_BOLD, fontSize: 11, fontWeight: '700', color: '#0A1628' },

  center: { paddingVertical: 80, alignItems: 'center' },
  emptyCard: { padding: 24, gap: 8, marginTop: 24 },
  emptyTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700', color: FG },
  emptyBody: { fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20, color: MUTED },
  retryButton: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: GOLD, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  retryText: { fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '700', color: '#0A1628' },
  signInWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  signInCard: { padding: 32, alignItems: 'center', gap: 16, width: '100%', maxWidth: 360 },
  signInTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: '700', color: FG, textAlign: 'center' },
  signInBody: { fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20, color: MUTED, textAlign: 'center' },
  signInButton: { backgroundColor: GOLD, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  signInButtonText: { fontFamily: FONT_BODY_BOLD, fontSize: 15, fontWeight: '700', color: '#0A1628' },
});

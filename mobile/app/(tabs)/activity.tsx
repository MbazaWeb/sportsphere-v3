/**
 * Activity Screen
 * ---------------
 * Live notifications feed from /api/notifications.
 * Falls back to a sign-in prompt if the user is not authenticated.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Heart, MessageCircle, UserPlus, AtSign, BadgeCheck, Bell, Trophy, ShieldCheck,
} from 'lucide-react-native';

import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import { colors } from '@sportsphere/design-system/tokens';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { notificationsApi } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import type { Notification as NotificationItem } from '@sportsphere/api-client';
import type { ApiError } from '@sportsphere/api-client';

const ICON_MAP: Record<string, { Icon: any; color: string; bg: string }> = {
  follow:        { Icon: UserPlus,      color: colors.primary, bg: 'rgba(245, 197, 24, 0.10)' },
  like:          { Icon: Heart,         color: colors.destructive, bg: 'rgba(255, 69, 58, 0.10)' },
  comment:       { Icon: MessageCircle, color: colors.status.info, bg: 'rgba(59, 130, 246, 0.10)' },
  reply:         { Icon: MessageCircle, color: colors.status.info, bg: 'rgba(59, 130, 246, 0.10)' },
  mention:       { Icon: AtSign,        color: colors.accent, bg: 'rgba(255, 107, 53, 0.10)' },
  verification:  { Icon: ShieldCheck,   color: colors.status.success, bg: 'rgba(16, 185, 129, 0.10)' },
  rank_change:   { Icon: Trophy,        color: colors.primary, bg: 'rgba(245, 197, 24, 0.10)' },
  system:        { Icon: Bell,          color: colors.mutedForeground, bg: colors.input },
};

export default function ActivityScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Header title="Activity" />
        <View style={styles.signInWrap}>
          <GlassCard elevated style={styles.signInCard}>
            <Bell size={32} color={colors.primary} />
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
      <Header title="Activity" />
      <View style={styles.content}>
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>Notifications</Text>
          <Text style={styles.introSubtitle}>
            {items.filter((n) => !n.isRead).length} unread · {items.length} total
          </Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationRow item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
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
      </View>
    </View>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const config = ICON_MAP[item.type] ?? ICON_MAP.system;
  const { Icon, color, bg } = config;

  return (
    <GlassCard style={[styles.row, !item.isRead && styles.rowUnread]}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  introBlock: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  introTitle: {
    fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: '700',
    color: colors.foreground, letterSpacing: -0.5,
  },
  introSubtitle: {
    fontFamily: FONT_BODY_REG, fontSize: 13, color: colors.mutedForeground, marginTop: 4,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14,
  },
  rowUnread: { borderColor: 'rgba(245, 197, 24, 0.20)' },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  rowMeta: { flex: 1, gap: 4 },
  actorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: {
    flex: 1, fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
  body: {
    fontFamily: FONT_BODY_REG, fontSize: 13, lineHeight: 18,
    color: colors.mutedForeground,
  },
  timestamp: {
    fontFamily: FONT_BODY_REG, fontSize: 11, color: colors.mutedForeground,
    marginTop: 2,
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary,
  },
  center: { paddingVertical: 80, alignItems: 'center' },
  emptyCard: { padding: 24, gap: 8, marginTop: 24 },
  emptyTitle: {
    fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700',
    color: colors.foreground,
  },
  emptyBody: {
    fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20,
    color: colors.mutedForeground,
  },
  retryButton: {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
  },
  retryText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '700',
    color: colors.primaryForeground,
  },
  signInWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  signInCard: { padding: 32, alignItems: 'center', gap: 16, width: '100%', maxWidth: 360 },
  signInTitle: {
    fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: '700',
    color: colors.foreground, textAlign: 'center',
  },
  signInBody: {
    fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20,
    color: colors.mutedForeground, textAlign: 'center',
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12,
    marginTop: 8,
  },
  signInButtonText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 15, fontWeight: '700',
    color: colors.primaryForeground,
  },
});

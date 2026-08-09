/**
 * Home Screen
 * -----------
 * Live feed pulled from /api/feed via @sportsphere/api-client.
 * Pull-to-refresh, type filter chips (For You / Trending / Spotlight),
 * and tap-to-like wired to /api/likes.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, RefreshControl,
  Pressable, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import Header from '../../components/Header';
import FeedCard from '../../components/FeedCard';
import GlassCard from '../../components/GlassCard';
import { colors } from '@sportsphere/design-system/tokens';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { feedApi, postsApi } from '../../lib/api';
import type { Post } from '@sportsphere/types/feed';
import type { ApiError } from '@sportsphere/api-client';

type FeedType = 'for-you' | 'trending' | 'spotlight';

const TABS: { id: FeedType; label: string }[] = [
  { id: 'for-you',   label: 'For You' },
  { id: 'trending',  label: 'Trending' },
  { id: 'spotlight', label: 'Spotlight' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [feed, setFeed] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<FeedType>('for-you');

  const loadFeed = useCallback(async (type: FeedType, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const list = await feedApi.list({ type });
      setFeed(list);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Failed to load feed');
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(activeType);
  }, [activeType, loadFeed]);

  const onRefresh = useCallback(() => loadFeed(activeType, true), [activeType, loadFeed]);

  const handleLike = useCallback(async (post: Post) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Optimistic update
    setFeed((prev) => prev.map((p) => p.id === post.id ? {
      ...p,
      likedByMe: !p.likedByMe,
      likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
    } : p));
    try {
      await postsApi.toggleLike(post.id);
    } catch {
      // Revert on failure
      setFeed((prev) => prev.map((p) => p.id === post.id ? {
        ...p,
        likedByMe: !p.likedByMe,
        likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
      } : p));
    }
  }, []);

  const handleAuthorPress = useCallback((post: Post) => {
    router.push(`/player/${post.author.id}`);
  }, [router]);

  return (
    <View style={styles.container}>
      <Header onTrophyPress={() => router.push('/leaderboard')} />
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveType(tab.id)}
            style={[styles.tabChip, activeType === tab.id && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeType === tab.id && styles.tabChipTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedCard
            post={item}
            onLike={handleLike}
            onAuthorPress={handleAuthorPress}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
          ) : error ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Couldn't load feed</Text>
              <Text style={styles.emptyBody}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => loadFeed(activeType)}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyBody}>
                Be the first to share something on Sportsphere. Tap Create to post.
              </Text>
            </GlassCard>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.input,
    borderWidth: 1, borderColor: colors.border,
  },
  tabChipActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  tabChipText: {
    fontFamily: FONT_BODY, fontSize: 13, color: colors.mutedForeground,
    fontWeight: '600',
  },
  tabChipTextActive: {
    color: colors.primaryForeground, fontWeight: '700',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },
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
});

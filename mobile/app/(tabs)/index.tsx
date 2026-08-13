/**
 * Home Screen — matches web HomeTab exactly
 * ------------------------------------------
 * - HomeHeader with SportSphere wordmark, search icon, trophy icon
 * - Sub-tab chips: For You, Trending, Spotlight (gold active, surface inactive)
 * - Feed cards with exact same layout as web FeedCard
 * - Pull-to-refresh, type filter chips, tap-to-like wired to /api/likes
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, RefreshControl,
  Pressable, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Trophy } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';

import FeedCard from '../../components/FeedCard';
import GlassCard from '../../components/GlassCard';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { feedApi, postsApi } from '../../lib/api';
import { sharePost } from '../../lib/sharing';
import type { Post } from '@sportsphere/types/feed';
import type { ApiError } from '@sportsphere/api-client';

type FeedType = 'for-you' | 'trending' | 'spotlight';

const GOLD = '#F5C518';
const BG = '#0A1628';
const BG_SECONDARY = '#0F1D3A';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

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
    setFeed((prev) => prev.map((p) => p.id === post.id ? {
      ...p,
      likedByMe: !p.likedByMe,
      likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
    } : p));
    try {
      await postsApi.toggleLike(post.id);
    } catch {
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

  const handleShare = useCallback((post: Post) => {
    sharePost(post.id, post.content || 'Check out this post on SportSphere!');
  }, []);

  const handleComment = useCallback((post: Post) => {
    router.push(`/p/${post.id}`);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* HomeHeader — SportSphere wordmark, search, trophy */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>SportSphere</Text>
        <View style={styles.headerActions}>
          <Pressable hitSlop={12} accessibilityLabel="Search">
            <Search color={FG} size={22} />
          </Pressable>
          <Pressable onPress={() => router.push('/leaderboard')} hitSlop={12} accessibilityLabel="Leaderboard">
            <Trophy color={GOLD} size={22} />
          </Pressable>
        </View>
      </View>

      {/* Sub-tab chips: For You, Trending, Spotlight */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeType === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveType(tab.id)}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
            >
              <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Feed list */}
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedCard
            post={item}
            onLike={handleLike}
            onAuthorPress={handleAuthorPress}
            onShare={handleShare}
            onComment={handleComment}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}><ActivityIndicator color={GOLD} size="large" /></View>
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
                Be the first to share something on SportSphere. Tap Create to post.
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
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  wordmark: {
    fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: '700',
    color: FG, letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  tabsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER,
  },
  tabChipActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  tabChipText: {
    fontFamily: FONT_BODY, fontSize: 13, color: MUTED,
    fontWeight: '600',
  },
  tabChipTextActive: {
    color: '#0A1628', fontWeight: '700',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },
  center: { paddingVertical: 80, alignItems: 'center' },
  emptyCard: { padding: 24, gap: 8, marginTop: 24 },
  emptyTitle: {
    fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700',
    color: FG,
  },
  emptyBody: {
    fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20,
    color: MUTED,
  },
  retryButton: {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: GOLD,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
  },
  retryText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '700',
    color: '#0A1628',
  },
});

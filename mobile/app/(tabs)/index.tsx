/**
 * Home Screen
 * -----------
 * Mirror of the web HomeTab — feed of posts with the Sportsphere glass-card aesthetic.
 * Uses mock data for now; Phase C will wire to /api/feed via @sportsphere/api-client.
 */

import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useCallback, useState } from 'react';

import Header from '../../components/Header';
import FeedCard, { type FeedCardData } from '../../components/FeedCard';
import { colors, typography } from '@sportsphere/design-system/tokens';

const MOCK_FEED: FeedCardData[] = [
  {
    id: '1',
    authorName: 'Marcus Rashford',
    authorHandle: 'marcusrashford',
    authorAvatar: undefined,
    verified: true,
    content: 'Big win tonight at Old Trafford. Three points, clean sheet, and the lads were class. On to the next. ⚽',
    likeCount: 12_400,
    commentCount: 348,
    shareCount: 89,
    liked: false,
    bookmarked: false,
  },
  {
    id: '2',
    authorName: 'Sportsphere',
    authorHandle: 'sportsphere',
    verified: true,
    content: '🏆 Performance Engine is live. Track your stats, climb the global ranking, and earn your tier — Bronze → Silver → Gold → Platinum → Diamond → Elite.',
    likeCount: 4_200,
    commentCount: 121,
    shareCount: 567,
    liked: true,
    bookmarked: true,
  },
  {
    id: '3',
    authorName: 'Carlo Ancelotti',
    authorHandle: 'mrancelotti',
    verified: true,
    content: 'The tactical flexibility of this Real Madrid side is what makes the difference. We adapt. We win. Hala Madrid.',
    likeCount: 8_900,
    commentCount: 234,
    shareCount: 142,
    liked: false,
    bookmarked: false,
  },
];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [feed] = useState(MOCK_FEED);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Phase C: await feedApi.list()
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Header />
      <View style={styles.feed}>
        {feed.map((post) => (
          <FeedCard key={post.id} data={post} />
        ))}
        <View style={styles.endNotice}>
          <Text style={styles.endNoticeText}>You're all caught up</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 100, // clear the tab bar
  },
  feed: {
    paddingHorizontal: 16,
    gap: 12,
  },
  endNotice: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  endNoticeText: {
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    color: colors.mutedForeground,
    fontSize: 13,
  },
});

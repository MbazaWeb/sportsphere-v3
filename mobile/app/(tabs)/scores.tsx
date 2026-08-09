/**
 * Scores Screen
 * -------------
 * Lists all active sports from the live /api/sports seed data.
 * Tapping a sport opens a sport detail sheet (fixtures + standings will
 * be added in a later phase; for now we show sport metadata + tags).
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import { colors } from '@sportsphere/design-system/tokens';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { sportsApi } from '../../lib/api';
import type { Sport } from '@sportsphere/api-client';
import type { ApiError } from '@sportsphere/api-client';

export default function ScoresScreen() {
  const router = useRouter();
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const list = await sportsApi.list();
      setSports(list);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Failed to load sports');
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: Sport }) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        // Future: router.push(`/sport/${item.slug}`);
      }}
    >
      <GlassCard style={styles.sportCard}>
        <View style={styles.sportHeader}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>{item.icon ?? '🏆'}</Text>
          </View>
          <View style={styles.sportMeta}>
            <Text style={styles.sportName}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <Badge>{item.category?.replace('_', ' ') ?? 'sport'}</Badge>
              {item.format ? <Badge>{item.format}</Badge> : null}
              {item.olympicStatus === 'olympic' ? (
                <Badge tone="gold">Olympic</Badge>
              ) : null}
            </View>
          </View>
        </View>
        {item.description ? (
          <Text style={styles.sportDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}
        {item.tags && item.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 4).map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </GlassCard>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Header title="Scores" onTrophyPress={() => router.push('/leaderboard')} />
      <View style={styles.content}>
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>Sports catalog</Text>
          <Text style={styles.introSubtitle}>
            Live data from the Sportsphere backend · {sports.length} active sports
          </Text>
        </View>

        <FlatList
          data={sports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
            ) : error ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Couldn't load sports</Text>
                <Text style={styles.emptyBody}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={() => load()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </GlassCard>
            ) : (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No sports available</Text>
              </GlassCard>
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </View>
    </View>
  );
}

function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'gold' }) {
  return (
    <View style={[styles.badge, tone === 'gold' && styles.badgeGold]}>
      <Text style={[styles.badgeText, tone === 'gold' && styles.badgeTextGold]}>
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
    </View>
  );
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
  sportCard: { padding: 16, gap: 12 },
  sportHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 28 },
  sportMeta: { flex: 1, gap: 6 },
  sportName: {
    fontFamily: FONT_BODY_BOLD, fontSize: 16, fontWeight: '700',
    color: colors.foreground,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    backgroundColor: colors.input,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  badgeGold: {
    backgroundColor: 'rgba(245, 197, 24, 0.10)',
    borderColor: 'rgba(245, 197, 24, 0.30)',
  },
  badgeText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: colors.mutedForeground, letterSpacing: 0.5,
  },
  badgeTextGold: { color: colors.primary },
  sportDescription: {
    fontFamily: FONT_BODY_REG, fontSize: 13, lineHeight: 18,
    color: colors.mutedForeground,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: 'rgba(255, 107, 53, 0.10)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  tagText: {
    fontFamily: FONT_BODY_REG, fontSize: 11,
    color: colors.accent,
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
});

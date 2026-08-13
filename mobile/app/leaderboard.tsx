/**
 * Leaderboard Screen (modal)
 * --------------------------
 * Live leaderboard from /api/leaderboard — top performers by real
 * performance points. Filter by dimension (Overall / Form / Improvement /
 * Consistency) and by role (All / Players / Coaches / Teams).
 *
 * Each row taps through to the player detail screen.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { X, Trophy, ChevronRight, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import * as Haptics from '../lib/haptics';

import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { colors } from '../lib/tokens';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../lib/fonts';
import { leaderboardApi } from '../lib/api';
import type { LeaderboardEntry, LeaderboardDimension } from '@sportsphere/api-client';
import type { ApiError } from '@sportsphere/api-client';

const DIMENSIONS: { id: LeaderboardDimension; label: string }[] = [
  { id: 'overall',      label: 'Overall' },
  { id: 'form',         label: 'Form' },
  { id: 'improvement',  label: 'Improvement' },
  { id: 'consistency',  label: 'Consistency' },
];

const ROLES: { id: string; label: string }[] = [
  { id: 'all',    label: 'All' },
  { id: 'player', label: 'Players' },
  { id: 'coach',  label: 'Coaches' },
  { id: 'team',   label: 'Teams' },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimension, setDimension] = useState<LeaderboardDimension>('overall');
  const [role, setRole] = useState('all');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const list = await leaderboardApi.list({
        dimension,
        role: role === 'all' ? undefined : role,
        limit: 25,
      });
      setEntries(list);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Failed to load leaderboard');
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, [dimension, role]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Trophy size={22} color={colors.primary} />
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close">
          <X size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Dimension chips */}
      <ScrollViewHorizontal>
        <View style={styles.chipRow}>
          {DIMENSIONS.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setDimension(d.id);
              }}
              style={[styles.chip, dimension === d.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, dimension === d.id && styles.chipTextActive]}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollViewHorizontal>

      {/* Role chips */}
      <ScrollViewHorizontal>
        <View style={styles.chipRow}>
          {ROLES.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setRole(r.id);
              }}
              style={[styles.chip, role === r.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, role === r.id && styles.chipTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollViewHorizontal>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push(`/player/${item.id}`);
            }}
          >
            <GlassCard style={[styles.row, index < 3 && styles.rowTop]}>
              <RankPill rank={item.rank} />
              <Avatar url={item.avatarUrl ?? undefined} size={40} goldRing={index < 3} />
              <View style={styles.rowMeta}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowHandle}>{item.handle}</Text>
                <View style={styles.rowTags}>
                  <TierBadge tier={item.tier} />
                  {item.position ? <MiniBadge>{item.position}</MiniBadge> : null}
                </View>
              </View>
              <View style={styles.rowStats}>
                <Text style={styles.pointsValue}>{formatPoints(item.points)}</Text>
                <Text style={styles.pointsLabel}>PTS</Text>
                <RankMovement movement={item.rankMovement} />
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </GlassCard>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
          ) : error ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Couldn't load leaderboard</Text>
              <Text style={styles.emptyBody}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => load()}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No ranked athletes yet</Text>
              <Text style={styles.emptyBody}>
                Once performance events are verified, top performers will appear here.
                Register and post to get started.
              </Text>
            </GlassCard>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

function ScrollViewHorizontal({ children }: { children: React.ReactNode }) {
  // Simple inline import to avoid an extra file
  const { ScrollView } = require('react-native');
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
      {children}
    </ScrollView>
  );
}

function RankPill({ rank }: { rank: number }) {
  const isTop3 = rank <= 3;
  const colors_ = {
    1: '#FFD700', // gold
    2: '#C0C0C0', // silver
    3: '#CD7F32', // bronze
  } as Record<number, string>;
  const bg = isTop3 ? colors_[rank] : colors.input;
  const fg = isTop3 ? '#0A1628' : colors.mutedForeground;
  return (
    <View style={[styles.rankPill, { backgroundColor: bg }]}>
      <Text style={[styles.rankPillText, { color: fg }]}>{rank}</Text>
    </View>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const tierColor = (tier || '').toLowerCase();
  const color =
    tierColor === 'elite' ? colors.tier.elite :
    tierColor === 'diamond' ? colors.tier.diamond :
    tierColor === 'platinum' ? colors.tier.platinum :
    tierColor === 'gold' ? colors.tier.gold :
    tierColor === 'silver' ? colors.tier.silver :
    tierColor === 'bronze' ? colors.tier.bronze :
    colors.mutedForeground;
  return (
    <View style={[styles.tierBadge, { borderColor: color }]}>
      <Text style={[styles.tierText, { color }]}>{(tier || 'Unranked').toUpperCase()}</Text>
    </View>
  );
}

function MiniBadge({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.miniBadge}>
      <Text style={styles.miniBadgeText}>{children}</Text>
    </View>
  );
}

function RankMovement({ movement }: { movement: number }) {
  if (!movement || movement === 0) {
    return <Minus size={12} color={colors.mutedForeground} />;
  }
  if (movement > 0) {
    return (
      <View style={styles.movementUp}>
        <TrendingUp size={11} color={colors.status.success} />
        <Text style={styles.movementUpText}>+{movement}</Text>
      </View>
    );
  }
  return (
    <View style={styles.movementDown}>
      <TrendingDown size={11} color={colors.destructive} />
      <Text style={styles.movementDownText}>{movement}</Text>
    </View>
  );
}

function formatPoints(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(Math.round(n));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: '700',
    color: colors.foreground, letterSpacing: -0.5,
  },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.input,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    fontFamily: FONT_BODY, fontSize: 13, color: colors.mutedForeground,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primaryForeground, fontWeight: '700',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12,
  },
  rowTop: { borderColor: 'rgba(245, 197, 24, 0.20)' },
  rankPill: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  rankPillText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '700',
  },
  rowMeta: { flex: 1, gap: 2 },
  rowName: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
  rowHandle: {
    fontFamily: FONT_BODY_REG, fontSize: 12, color: colors.mutedForeground,
  },
  rowTags: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  tierBadge: {
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tierText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    letterSpacing: 0.5,
  },
  miniBadge: {
    backgroundColor: colors.input,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  miniBadgeText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: colors.mutedForeground, letterSpacing: 0.5,
  },
  rowStats: { alignItems: 'flex-end', gap: 2 },
  pointsValue: {
    fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700',
    color: colors.primary,
  },
  pointsLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: colors.mutedForeground, letterSpacing: 0.5,
  },
  movementUp: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  movementUpText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700',
    color: colors.status.success,
  },
  movementDown: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  movementDownText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700',
    color: colors.destructive,
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

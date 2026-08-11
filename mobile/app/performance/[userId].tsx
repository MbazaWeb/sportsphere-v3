import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, TrendingUp, TrendingDown, Minus, Trophy, Target, Zap, Clock } from 'lucide-react-native';

import Avatar from '../../components/Avatar';
import GlassCard from '../../components/GlassCard';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { performanceApi } from '../../lib/api';
import type { PerformanceResponse } from '@sportsphere/api-client';

const GOLD = '#F5C518';
const BG = '#0A1628';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

export default function PerformanceDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await performanceApi.getProfile(userId);
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load performance data');
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  const profile = data?.profile;
  const user = data?.user;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={FG} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Performance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={GOLD} />
        }
      >
        {!profile || !user ? (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorTitle}>No Profile Found</Text>
            <Text style={styles.errorBody}>Performance data is only available for verified Players, Coaches, and Teams.</Text>
          </GlassCard>
        ) : (
          <>
            {/* User Intro */}
            <View style={styles.userCard}>
              <Avatar url={user.avatarUrl ?? undefined} size={80} goldRing />
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userHandle}>@{user.handle}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role.toUpperCase()} · {user.position || user.playerType || 'Specialist'}</Text>
              </View>
            </View>

            {/* Headline Stats */}
            <View style={styles.grid}>
              <GlassCard style={styles.statCard}>
                <Text style={styles.statLabel}>TIER</Text>
                <Text style={[styles.statValue, { color: GOLD }]}>{profile.tier}</Text>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL POINTS</Text>
                <Text style={styles.statValue}>{profile.totalPoints.toLocaleString()}</Text>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <Text style={styles.statLabel}>GLOBAL RANK</Text>
                <Text style={styles.statValue}>#{profile.rankGlobal || '—'}</Text>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <Text style={styles.statLabel}>PERCENTILE</Text>
                <Text style={styles.statValue}>{data.percentile ? `${data.percentile.toFixed(1)}%` : '—'}</Text>
              </GlassCard>
            </View>

            {/* Scores Section */}
            <Text style={styles.sectionTitle}>Performance Scores</Text>
            <GlassCard style={styles.scoresCard}>
              <ScoreRow label="Overall Performance" value={profile.performanceScore} color={GOLD} />
              <View style={styles.divider} />
              <ScoreRow label="Current Form" value={profile.formScore} color="#3B82F6" />
              <View style={styles.divider} />
              <ScoreRow label="Consistency" value={profile.consistencyScore} color="#22C55E" />
              <View style={styles.divider} />
              <ScoreRow label="Improvement" value={profile.improvementScore} color="#FF6B35" />
            </GlassCard>

            {/* Recent Events */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Clock size={16} color={MUTED} />
            </View>

            {data.events.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>No verified match events recorded yet.</Text>
              </GlassCard>
            ) : (
              data.events.map(event => (
                <GlassCard key={event.id} style={styles.eventRow}>
                  <View style={styles.eventIcon}>
                    <Zap size={16} color={GOLD} />
                  </View>
                  <View style={styles.eventMeta}>
                    <Text style={styles.eventTitle}>{event.eventType.replace('-', ' ').toUpperCase()}</Text>
                    <Text style={styles.eventDate}>{new Date(event.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.eventPoints, { color: event.pointsDelta >= 0 ? '#22C55E' : '#FF453A' }]}>
                    {event.pointsDelta >= 0 ? '+' : ''}{event.pointsDelta}
                  </Text>
                </GlassCard>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ScoreRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreInfo}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={[styles.scoreValue, { color }]}>{value.toFixed(1)}</Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700', color: FG },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 20 },

  userCard: { alignItems: 'center', gap: 6, marginVertical: 10 },
  userName: { fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: '700', color: FG },
  userHandle: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED },
  roleBadge: { backgroundColor: SURFACE, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  roleText: { fontFamily: FONT_BODY_BOLD, fontSize: 10, color: GOLD, letterSpacing: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', padding: 16, alignItems: 'center', gap: 4 },
  statLabel: { fontFamily: FONT_BODY_BOLD, fontSize: 10, color: MUTED, letterSpacing: 0.5 },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: '700', color: FG },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700', color: FG },

  scoresCard: { padding: 16, gap: 16 },
  scoreRow: { gap: 8 },
  scoreInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  scoreLabel: { fontFamily: FONT_BODY, fontSize: 14, color: FG },
  scoreValue: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: SURFACE, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  divider: { height: 1, backgroundColor: BORDER },

  eventRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, marginBottom: 8 },
  eventIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  eventMeta: { flex: 1, gap: 2 },
  eventTitle: { fontFamily: FONT_BODY_BOLD, fontSize: 12, color: FG },
  eventDate: { fontFamily: FONT_BODY_REG, fontSize: 11, color: MUTED },
  eventPoints: { fontFamily: FONT_BODY_BOLD, fontSize: 14 },

  emptyCard: { padding: 30, alignItems: 'center' },
  emptyText: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center' },
  errorCard: { padding: 24, gap: 8, alignItems: 'center' },
  errorTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: '700', color: FG },
  errorBody: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center' },
});

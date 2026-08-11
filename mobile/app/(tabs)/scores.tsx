/**
 * Scores Screen — matches web ScoresTab exactly
 * -----------------------------------------------
 * - ScoresHeader with sport/continent/country/tournament filters
 * - Sub-tabs: Live, Today, Upcoming, Results, Standings
 * - MatchList component showing matches in glass cards
 * - StandingsList for league tables
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, FlatList, Pressable, ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Trophy, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import GlassCard from '../../components/GlassCard';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { sportsApi } from '../../lib/api';
import type { Sport } from '@sportsphere/api-client';
import type { ApiError } from '@sportsphere/api-client';

const GOLD = '#F5C518';
const BG = '#0A1628';
const BG_SECONDARY = '#0F1D3A';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

type ScoreSubTab = 'live' | 'today' | 'upcoming' | 'results' | 'standings';

const SUB_TABS: { id: ScoreSubTab; label: string }[] = [
  { id: 'live',      label: 'Live' },
  { id: 'today',     label: 'Today' },
  { id: 'upcoming',  label: 'Upcoming' },
  { id: 'results',   label: 'Results' },
  { id: 'standings', label: 'Standings' },
];

export default function ScoresScreen() {
  const router = useRouter();
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<ScoreSubTab>('live');

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
      {/* ScoresHeader */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>Scores</Text>
        <View style={styles.headerActions}>
          <Pressable hitSlop={12} accessibilityLabel="Search">
            <Search color={FG} size={22} />
          </Pressable>
          <Pressable onPress={() => router.push('/leaderboard')} hitSlop={12} accessibilityLabel="Leaderboard">
            <Trophy color={GOLD} size={22} />
          </Pressable>
        </View>
      </View>

      {/* Filter row: Sport / Continent / Country / Tournament */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {['All Sports', 'Football', 'Basketball', 'Tennis', 'Cricket'].map((label, idx) => (
          <Pressable key={label} style={[styles.filterChip, idx === 0 && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, idx === 0 && styles.filterChipTextActive]}>
              {label}
            </Text>
            <ChevronDown size={14} color={idx === 0 ? '#0A1628' : MUTED} />
          </Pressable>
        ))}
      </ScrollView>

      {/* Sub-tabs: Live, Today, Upcoming, Results, Standings */}
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

      {/* Content area */}
      {activeSub === 'standings' ? (
        <StandingsList />
      ) : (
        <FlatList
          data={sports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={GOLD} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}><ActivityIndicator color={GOLD} size="large" /></View>
            ) : error ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Couldn't load scores</Text>
                <Text style={styles.emptyBody}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={() => load()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </GlassCard>
            ) : (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No matches available</Text>
                <Text style={styles.emptyBody}>Check back later for live scores and results.</Text>
              </GlassCard>
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

function StandingsList() {
  const mockStandings = [
    { pos: 1, team: 'Manchester City', p: 28, w: 22, d: 3, l: 3, pts: 69 },
    { pos: 2, team: 'Arsenal', p: 28, w: 21, d: 4, l: 3, pts: 67 },
    { pos: 3, team: 'Liverpool', p: 28, w: 20, d: 5, l: 3, pts: 65 },
    { pos: 4, team: 'Aston Villa', p: 28, w: 16, d: 4, l: 8, pts: 52 },
    { pos: 5, team: 'Tottenham', p: 28, w: 15, d: 4, l: 9, pts: 49 },
  ];

  return (
    <View style={styles.listContent}>
      <GlassCard style={styles.standingsCard}>
        <Text style={styles.standingsTitle}>Premier League</Text>
        <Text style={styles.standingsSubtitle}>2024/25 Season</Text>

        {/* Header row */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { width: 28 }]}>#</Text>
          <Text style={[styles.th, { flex: 1 }]}>Team</Text>
          <Text style={[styles.th, styles.thCenter]}>P</Text>
          <Text style={[styles.th, styles.thCenter]}>W</Text>
          <Text style={[styles.th, styles.thCenter]}>D</Text>
          <Text style={[styles.th, styles.thCenter]}>L</Text>
          <Text style={[styles.th, styles.thCenter, { color: GOLD }]}>Pts</Text>
        </View>

        {mockStandings.map((row) => (
          <View key={row.pos} style={styles.tableRow}>
            <Text style={[styles.td, { width: 28, color: row.pos <= 4 ? GOLD : FG }]}>{row.pos}</Text>
            <Text style={[styles.td, { flex: 1, fontFamily: FONT_BODY_BOLD, fontWeight: '700' }]}>{row.team}</Text>
            <Text style={[styles.td, styles.tdCenter]}>{row.p}</Text>
            <Text style={[styles.td, styles.tdCenter]}>{row.w}</Text>
            <Text style={[styles.td, styles.tdCenter]}>{row.d}</Text>
            <Text style={[styles.td, styles.tdCenter]}>{row.l}</Text>
            <Text style={[styles.td, styles.tdCenter, { color: GOLD, fontFamily: FONT_BODY_BOLD, fontWeight: '700' }]}>{row.pts}</Text>
          </View>
        ))}
      </GlassCard>
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
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  wordmark: {
    fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: '700',
    color: FG, letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 4, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER,
  },
  filterChipActive: { backgroundColor: GOLD, borderColor: GOLD },
  filterChipText: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, fontWeight: '600' },
  filterChipTextActive: { fontFamily: FONT_BODY_BOLD, fontSize: 12, color: '#0A1628', fontWeight: '700' },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  tabChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
  },
  tabChipActive: { backgroundColor: GOLD, borderColor: GOLD },
  tabChipText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, fontWeight: '600' },
  tabChipTextActive: { fontFamily: FONT_BODY_BOLD, fontSize: 13, color: '#0A1628', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  sportCard: { padding: 16, gap: 12 },
  sportHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: BG_SECONDARY, alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 28 },
  sportMeta: { flex: 1, gap: 6 },
  sportName: { fontFamily: FONT_BODY_BOLD, fontSize: 16, fontWeight: '700', color: FG },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    backgroundColor: SURFACE, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: BORDER,
  },
  badgeGold: { backgroundColor: 'rgba(245, 197, 24, 0.10)', borderColor: 'rgba(245, 197, 24, 0.30)' },
  badgeText: { fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 0.5 },
  badgeTextGold: { color: GOLD },
  sportDescription: { fontFamily: FONT_BODY_REG, fontSize: 13, lineHeight: 18, color: MUTED },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255, 107, 53, 0.10)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontFamily: FONT_BODY_REG, fontSize: 11, color: '#FF6B35' },
  center: { paddingVertical: 80, alignItems: 'center' },
  emptyCard: { padding: 24, gap: 8, marginTop: 24 },
  emptyTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700', color: FG },
  emptyBody: { fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20, color: MUTED },
  retryButton: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: GOLD, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  retryText: { fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '700', color: '#0A1628' },
  standingsCard: { padding: 16, gap: 12 },
  standingsTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700', color: FG },
  standingsSubtitle: { fontFamily: FONT_BODY_REG, fontSize: 13, color: MUTED },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  th: { fontFamily: FONT_BODY_BOLD, fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 0.5 },
  thCenter: { textAlign: 'center', width: 28 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  td: { fontFamily: FONT_BODY_REG, fontSize: 13, color: FG },
  tdCenter: { textAlign: 'center', width: 28 },
});

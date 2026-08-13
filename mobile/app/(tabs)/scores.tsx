/**
 * Scores Screen — FULL REWRITE
 * ----------------------------
 * Tab-based: Live | Today | Upcoming | Results | Standings
 * League filter via horizontal scroll chips.
 * Pull-to-refresh. Auto-refresh live every 30s.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, FlatList,
  Pressable, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Trophy, ChevronDown } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';

import Header from '../../components/Header';
import MatchCard from '../../components/MatchCard';
import { colors, radii } from '../../lib/tokens';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { useAuthStore } from '../../lib/authStore';
import type { Match, Standing, MatchStatus } from '../../lib/match-types';
import { POPULAR_LEAGUES } from '../../lib/match-types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://sportssphere.fun/sportsphere';

const TABS: { id: MatchStatus; label: string }[] = [
  { id: 'live',     label: 'Live' },
  { id: 'today',    label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results',  label: 'Results' },
  { id: 'standings', label: 'Standings' },
];

export default function ScoresScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.session?.token);

  const [activeTab, setActiveTab] = useState<MatchStatus>('live');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [leaguePickerOpen, setLeaguePickerOpen] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [standingsLeague, setStandingsLeague] = useState('English Premier League');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState(0);

  const liveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch matches ──────────────────────────────────────
  const fetchMatches = useCallback(async (status: MatchStatus, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams({ status });
      if (selectedLeague !== 'All') sp.set('league', selectedLeague);
      const res = await fetch(`${API_BASE}/api/matches?${sp.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load matches');
      setMatches([]);
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, [selectedLeague, token]);

  // ─── Fetch standings ─────────────────────────────────────
  const fetchStandings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (standingsLeague !== 'All') sp.set('league', standingsLeague);
      const res = await fetch(`${API_BASE}/api/standings?${sp.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStandings(Array.isArray(data?.standings) ? data.standings : []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load standings');
      setStandings([]);
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, [standingsLeague, token]);

  // ─── Fetch live count for badge ──────────────────────────
  const fetchLiveCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/matches?status=live`);
      if (res.ok) {
        const data = await res.json();
        setLiveCount(Array.isArray(data) ? data.length : 0);
      }
    } catch { /* silent */ }
  }, []);

  // ─── Effects ─────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'standings') {
      fetchStandings();
    } else {
      fetchMatches(activeTab);
    }
    fetchLiveCount();
  }, [activeTab, fetchMatches, fetchStandings, fetchLiveCount]);

  // Auto-refresh live every 30s
  useEffect(() => {
    if (liveInterval.current) clearInterval(liveInterval.current);
    if (activeTab === 'live') {
      liveInterval.current = setInterval(() => {
        fetchMatches('live', true);
        fetchLiveCount();
      }, 30000);
    }
    return () => { if (liveInterval.current) clearInterval(liveInterval.current); };
  }, [activeTab, fetchMatches, fetchLiveCount]);

  const onRefresh = useCallback(() => {
    if (activeTab === 'standings') fetchStandings(true);
    else fetchMatches(activeTab, true);
    fetchLiveCount();
  }, [activeTab, fetchMatches, fetchStandings, fetchLiveCount]);

  const handleLeagueSelect = (league: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedLeague(league);
    setLeaguePickerOpen(false);
  };

  // ─── Render ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Header
        title="Scores"
        showSearch={false}
        onTrophyPress={() => router.push('/leaderboard')}
      />

      {/* Status tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab(tab.id);
              }}
              style={[styles.tabChip, activeTab === tab.id && styles.tabChipActive]}
            >
              <Text style={[styles.tabChipText, activeTab === tab.id && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
              {tab.id === 'live' && liveCount > 0 ? (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>{liveCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* League filter (not for standings) */}
      {activeTab !== 'standings' && (
        <View style={styles.filterRow}>
          <Pressable
            style={styles.leagueSelector}
            onPress={() => setLeaguePickerOpen(!leaguePickerOpen)}
          >
            <Text style={styles.leagueSelectorText} numberOfLines={1}>
              {selectedLeague}
            </Text>
            <ChevronDown
              size={14}
              color={colors.mutedForeground}
              style={{ transform: [{ rotate: leaguePickerOpen ? '180deg' : '0deg' }] }}
            />
          </Pressable>
        </View>
      )}

      {/* League picker dropdown */}
      {leaguePickerOpen && (
        <View style={styles.pickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerRow}>
              <Pressable style={[styles.pickerChip, selectedLeague === 'All' && styles.pickerChipActive]} onPress={() => handleLeagueSelect('All')}>
                <Text style={[styles.pickerChipText, selectedLeague === 'All' && styles.pickerChipTextActive]}>All</Text>
              </Pressable>
              {POPULAR_LEAGUES.map((lg: string) => (
                <Pressable key={lg} style={[styles.pickerChip, selectedLeague === lg && styles.pickerChipActive]} onPress={() => handleLeagueSelect(lg)}>
                  <Text style={[styles.pickerChipText, selectedLeague === lg && styles.pickerChipTextActive]} numberOfLines={1}>{lg}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Standings league selector */}
      {activeTab === 'standings' && (
        <View style={styles.filterRow}>
          <Pressable style={styles.leagueSelector} onPress={() => setLeaguePickerOpen(!leaguePickerOpen)}>
            <Text style={styles.leagueSelectorText} numberOfLines={1}>{standingsLeague}</Text>
            <ChevronDown size={14} color={colors.mutedForeground} style={{ transform: [{ rotate: leaguePickerOpen ? '180deg' : '0deg' }] }} />
          </Pressable>
        </View>
      )}

      {leaguePickerOpen && activeTab === 'standings' && (
        <View style={styles.pickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerRow}>
              {POPULAR_LEAGUES.map((lg: string) => (
                <Pressable key={lg} style={[styles.pickerChip, standingsLeague === lg && styles.pickerChipActive]} onPress={() => { setStandingsLeague(lg); setLeaguePickerOpen(false); }}>
                  <Text style={[styles.pickerChipText, standingsLeague === lg && styles.pickerChipTextActive]} numberOfLines={1}>{lg}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {activeTab === 'standings' ? (
        <StandingsList standings={standings} loading={loading} />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MatchCard match={item} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
            ) : error ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Couldn&apos;t load data</Text>
                <Text style={styles.emptyBody}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={onRefresh}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'live' ? 'No live matches right now' : 'No matches found'}
                </Text>
                <Text style={styles.emptyBody}>
                  {activeTab === 'live'
                    ? 'Check back soon or browse upcoming fixtures.'
                    : 'Try selecting a different league or tab.'}
                </Text>
              </View>
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

// ─── Standings sub-component ────────────────────────────────

function StandingsList({ standings, loading }: { standings: Standing[]; loading: boolean }) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (standings.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No standings available</Text>
        <Text style={styles.emptyBody}>Select a league to view the table.</Text>
      </View>
    );
  }

  return (
    <View style={styles.standingsWrap}>
      {/* Header row */}
      <View style={[styles.standingRow, styles.standingHeader]}>
        <Text style={[styles.stPos, styles.standingHeaderText]}>#</Text>
        <Text style={[styles.stTeam, styles.standingHeaderText]}>Team</Text>
        <Text style={[styles.stSmall, styles.standingHeaderText]}>P</Text>
        <Text style={[styles.stSmall, styles.standingHeaderText]}>W</Text>
        <Text style={[styles.stSmall, styles.standingHeaderText]}>D</Text>
        <Text style={[styles.stSmall, styles.standingHeaderText]}>L</Text>
        <Text style={[styles.stSmall, styles.standingHeaderText]}>GD</Text>
        <Text style={[styles.stPts, styles.standingHeaderText]}>Pts</Text>
      </View>
      {standings.map((s, i) => {
        const isTop4 = i < 4;
        const isRelZone = i >= standings.length - 3;
        return (
          <View
            key={s.position}
            style={[styles.standingRow, isTop4 && styles.standingRowTop4, isRelZone && styles.standingRowRel]}
          >
            <Text style={[styles.stPos, isTop4 && { color: colors.primary }]}>{s.position}</Text>
            <Text style={styles.stTeam} numberOfLines={1}>{s.team}</Text>
            <Text style={styles.stSmall}>{s.played}</Text>
            <Text style={styles.stSmall}>{s.won}</Text>
            <Text style={styles.stSmall}>{s.drawn}</Text>
            <Text style={styles.stSmall}>{s.lost}</Text>
            <Text style={[styles.stSmall, s.goalDifference > 0 && { color: '#10B981' }, s.goalDifference < 0 && { color: colors.destructive }]}>
              {s.goalDifference > 0 ? '+' : ''}{s.goalDifference}
            </Text>
            <Text style={[styles.stPts, isTop4 && { color: colors.primary }]}>{s.points}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabsScroll: { flexGrow: 0 },
  tabsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8,
  },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '600',
    color: colors.mutedForeground,
  },
  tabChipTextActive: {
    color: colors.primaryForeground, fontWeight: '700',
  },
  liveBadge: {
    backgroundColor: colors.destructive,
    borderRadius: 999, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  liveBadgeText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '800',
    color: '#FFFFFF',
  },
  filterRow: {
    paddingHorizontal: 16, paddingBottom: 8,
  },
  leagueSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 8,
  },
  leagueSelectorText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '600',
    color: colors.foreground, flex: 1,
  },
  pickerContainer: {
    paddingHorizontal: 16, paddingBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row', gap: 8,
  },
  pickerChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  pickerChipActive: {
    backgroundColor: 'rgba(245, 197, 24, 0.15)',
    borderColor: 'rgba(245, 197, 24, 0.40)',
  },
  pickerChipText: {
    fontFamily: FONT_BODY, fontSize: 12,
    color: colors.mutedForeground, maxWidth: 140,
  },
  pickerChipTextActive: {
    color: colors.primary, fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4,
  },
  center: { paddingVertical: 80, alignItems: 'center' },
  emptyCard: {
    padding: 24, gap: 8, marginTop: 24, marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.lg,
  },
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
  // Standings
  standingsWrap: {
    paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radii.lg, marginHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  standingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  standingHeader: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  standingHeaderText: {
    color: colors.mutedForeground, fontSize: 10, fontWeight: '700',
  },
  standingRowTop4: {
    borderLeftWidth: 2, borderLeftColor: colors.primary,
  },
  standingRowRel: {
    borderLeftWidth: 2, borderLeftColor: colors.destructive,
  },
  stPos: {
    width: 24, fontFamily: FONT_BODY_BOLD, fontSize: 12, fontWeight: '700',
    color: colors.mutedForeground, textAlign: 'center',
  },
  stTeam: {
    flex: 1, fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '600',
    color: colors.foreground, paddingHorizontal: 8,
  },
  stSmall: {
    width: 28, fontFamily: FONT_BODY, fontSize: 12,
    color: colors.mutedForeground, textAlign: 'center',
  },
  stPts: {
    width: 32, fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '800',
    color: colors.foreground, textAlign: 'center',
  },
});

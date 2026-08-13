/**
 * Player / User Detail Screen
 * ---------------------------
 * Pulls the public profile via /api/profile?handle and the Performance
 * Card data via /api/performance/[userId]. Shows:
 *   - avatar, name, role, tier
 *   - bio, location, joined date
 *   - follower / following / post counts
 *   - performance summary (points, rank, tier progress, recent events)
 *   - follow button (toggles /api/follows)
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, BadgeCheck, MapPin, Calendar, Users, FileText, Crown,
  TrendingUp, BarChart3, Trophy, Target, Activity, UserPlus, UserCheck,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';

import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import { colors } from '../../lib/tokens';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { profileApi, performanceApi, followsApi } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import type { PublicUser } from '@sportsphere/types/auth';
import type { PerformanceResponse } from '@sportsphere/api-client';
import type { ApiError } from '@sportsphere/api-client';

export default function PlayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAuthStore((s) => s.session);

  const [user, setUser] = useState<PublicUser | null>(null);
  const [perf, setPerf] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // Try /api/users/[id] first (mobile-friendly path), fall back to /api/profile?handle
      let profile: PublicUser | null = null;
      try {
        profile = await profileApi.getById(id);
      } catch {
        // Fallback: treat id as handle
        try {
          profile = await profileApi.getByHandle(id.startsWith('@') ? id : `@${id}`);
        } catch {
          /* swallow — we'll surface the error below */
        }
      }
      if (!profile) {
        setError('User not found');
        return;
      }
      setUser(profile);
      // Load performance in parallel (don't block the screen on it)
      performanceApi.getProfile(profile.id)
        .then(setPerf)
        .catch(() => {/* profile may not have perf data — OK */});
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleFollow = useCallback(async () => {
    if (!session) {
      Alert.alert('Sign in required', 'Please sign in to follow other users.');
      router.push('/(auth)/login');
      return;
    }
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setFollowLoading(true);
    // Optimistic
    setFollowing((v) => !v);
    try {
      const res = await followsApi.toggle(user.id);
      setFollowing(res.following);
    } catch {
      setFollowing((v) => !v); // revert
    } finally {
      setFollowLoading(false);
    }
  }, [session, user, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.content}>
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Couldn't load profile</Text>
            <Text style={styles.emptyBody}>{error ?? 'Unknown error'}</Text>
            <Pressable style={styles.retryButton} onPress={load}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </GlassCard>
        </View>
      </View>
    );
  }

  const profile = perf?.profile;
  const tier = profile?.tier ?? 'Unranked';
  const tierColor =
    (tier as string).toLowerCase() === 'elite' ? colors.tier.elite :
    (tier as string).toLowerCase() === 'diamond' ? colors.tier.diamond :
    (tier as string).toLowerCase() === 'platinum' ? colors.tier.platinum :
    (tier as string).toLowerCase() === 'gold' ? colors.tier.gold :
    (tier as string).toLowerCase() === 'silver' ? colors.tier.silver :
    (tier as string).toLowerCase() === 'bronze' ? colors.tier.bronze :
    colors.mutedForeground;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.topBarTitle}>Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Profile header */}
      <GlassCard elevated style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar url={user.avatarUrl ?? undefined} size={84} goldRing={user.isVerified || !!user.isPro} />
          <View style={styles.profileMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName} numberOfLines={1}>{user.name}</Text>
              {user.isVerified ? <BadgeCheck size={18} color={colors.primary} /> : null}
              {user.isPro ? (
                <View style={styles.proBadge}>
                  <Crown size={10} color={colors.primaryForeground} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.handle}>{user.handle}</Text>
            <View style={styles.roleRow}>
              <Text style={styles.roleIcon}>{user.roleIcon ?? '⭐'}</Text>
              <Text style={styles.roleName}>{user.roleName ?? 'Fan'}</Text>
              <Text style={styles.roleSep}>·</Text>
              <Text style={styles.roleType}>{user.typeName ?? 'Casual'}</Text>
            </View>
          </View>
        </View>

        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

        <View style={styles.metaRow}>
          {user.location ? (
            <View style={styles.metaItem}>
              <MapPin size={13} color={colors.mutedForeground} />
              <Text style={styles.metaText}>{user.location}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Calendar size={13} color={colors.mutedForeground} />
            <Text style={styles.metaText}>
              Joined {new Date(user.registeredAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat icon={FileText} label="Posts"     value={user.postCount} />
          <Stat icon={Users}    label="Followers" value={user.followerCount} />
          <Stat icon={UserCheck} label="Following" value={user.followingCount} />
        </View>

        {session?.user?.id !== user.id ? (
          <Pressable
            style={[styles.followButton, following && styles.followingButton]}
            disabled={followLoading}
            onPress={handleFollow}
          >
            {following ? (
              <>
                <UserCheck size={16} color={colors.foreground} />
                <Text style={styles.followingText}>Following</Text>
              </>
            ) : (
              <>
                <UserPlus size={16} color={colors.primaryForeground} />
                <Text style={styles.followText}>Follow</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </GlassCard>

      {/* Performance Card */}
      <GlassCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <BarChart3 size={16} color={colors.accent} />
          <Text style={styles.sectionTitle}>Performance</Text>
        </View>

        {!profile ? (
          <View style={styles.perfEmpty}>
            <Text style={styles.perfEmptyTitle}>No performance data yet</Text>
            <Text style={styles.perfEmptyBody}>
              Once this user has verified performance events, their card will populate here.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.tierRow}>
              <View style={[styles.tierBadge, { borderColor: tierColor }]}>
                <Text style={[styles.tierText, { color: tierColor }]}>{tier.toUpperCase()}</Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankValue}>#{profile.rankGlobal ?? '—'}</Text>
                <Text style={styles.rankLabel}>GLOBAL</Text>
              </View>
            </View>

            <View style={styles.pointsBlock}>
              <Text style={styles.pointsValue}>{Math.round(profile.totalPoints).toLocaleString()}</Text>
              <Text style={styles.pointsLabel}>PERFORMANCE POINTS</Text>
            </View>

            <View style={styles.scoreGrid}>
              <ScoreCard icon={TrendingUp} label="Form"          value={profile.formScore} />
              <ScoreCard icon={Target}     label="Consistency"   value={profile.consistencyScore} />
              <ScoreCard icon={Activity}   label="Improvement"   value={profile.improvementScore} />
            </View>

            {perf?.percentile != null ? (
              <View style={styles.percentileRow}>
                <Trophy size={12} color={colors.primary} />
                <Text style={styles.percentileText}>
                  Top {Math.min(100, Math.round(perf.percentile))}% in {profile.categoryBucket || 'their category'}
                  {perf.categorySize ? ` · ${perf.categorySize} peers` : ''}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </GlassCard>

      {/* Recent events */}
      {perf?.events && perf.events.length > 0 ? (
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Activity size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Recent events</Text>
          </View>
          {perf.events.slice(0, 5).map((event) => (
            <View key={event.id} style={styles.eventRow}>
              <View style={styles.eventIconWrap}>
                <Text style={styles.eventIcon}>⚡</Text>
              </View>
              <View style={styles.eventMeta}>
                <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>
                <Text style={styles.eventDate}>
                  {new Date(event.eventDate).toLocaleDateString()} · {event.eventType}
                </Text>
              </View>
              <View style={[styles.eventPoints, event.pointsDelta < 0 && styles.eventPointsNegative]}>
                <Text style={[styles.eventPointsText, event.pointsDelta < 0 && styles.eventPointsTextNegative]}>
                  {event.pointsDelta > 0 ? '+' : ''}{event.pointsDelta}
                </Text>
              </View>
            </View>
          ))}
        </GlassCard>
      ) : null}

      {/* Sports */}
      {user.sports && user.sports.length > 0 ? (
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Trophy size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Sports</Text>
          </View>
          <View style={styles.sportsGrid}>
            {user.sports.map((sport) => (
              <View key={sport.id} style={styles.sportChip}>
                <Text style={styles.sportChipIcon}>{sport.icon ?? '🏆'}</Text>
                <Text style={styles.sportChipText}>{sport.name}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      ) : null}
    </ScrollView>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Icon size={14} color={colors.mutedForeground} />
      <Text style={styles.statValue}>{formatCount(value)}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

function ScoreCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.scoreCard}>
      <Icon size={14} color={colors.mutedForeground} />
      <Text style={styles.scoreValue}>{Math.round(value)}</Text>
      <Text style={styles.scoreLabel}>{label.toUpperCase()}</Text>
      <View style={styles.scoreBarWrap}>
        <View style={[styles.scoreBar, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: 12,
  },
  topBarTitle: {
    fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: '700',
    color: colors.foreground,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileCard: { padding: 20, gap: 16 },
  profileHeader: { flexDirection: 'row', gap: 16 },
  profileMeta: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  displayName: {
    flexShrink: 1, fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: '700',
    color: colors.foreground, letterSpacing: -0.5,
  },
  handle: {
    fontFamily: FONT_BODY_REG, fontSize: 13, color: colors.mutedForeground,
  },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  roleIcon: { fontSize: 14 },
  roleName: {
    fontFamily: FONT_BODY_BOLD, fontSize: 12, fontWeight: '700',
    color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  roleSep: { color: colors.mutedForeground, fontSize: 12 },
  roleType: {
    fontFamily: FONT_BODY_REG, fontSize: 12, color: colors.mutedForeground,
  },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.accent, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  proBadgeText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: colors.accentForeground, letterSpacing: 0.5,
  },
  bio: {
    fontFamily: FONT_BODY, fontSize: 14, lineHeight: 20,
    color: colors.foreground,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontFamily: FONT_BODY_REG, fontSize: 12, color: colors.mutedForeground,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: {
    fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700',
    color: colors.foreground,
  },
  statLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700',
    color: colors.mutedForeground, letterSpacing: 0.5,
  },
  followButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12, borderRadius: 12,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: colors.border,
  },
  followText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.primaryForeground,
  },
  followingText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
  sectionCard: { padding: 16, gap: 12, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
  perfEmpty: { paddingVertical: 16, alignItems: 'center', gap: 6 },
  perfEmptyTitle: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
  perfEmptyBody: {
    fontFamily: FONT_BODY_REG, fontSize: 12, color: colors.mutedForeground,
    textAlign: 'center', lineHeight: 16,
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierBadge: {
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tierText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 12, fontWeight: '700',
    letterSpacing: 0.5,
  },
  rankInfo: { alignItems: 'flex-end' },
  rankValue: {
    fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: '700',
    color: colors.foreground,
  },
  rankLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: colors.mutedForeground, letterSpacing: 0.5,
  },
  pointsBlock: { alignItems: 'center', paddingVertical: 12 },
  pointsValue: {
    fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: '700',
    color: colors.primary,
  },
  pointsLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700',
    color: colors.mutedForeground, letterSpacing: 0.5,
  },
  scoreGrid: { flexDirection: 'row', gap: 8 },
  scoreCard: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: colors.input,
    borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  scoreValue: {
    fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700',
    color: colors.foreground,
  },
  scoreLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: colors.mutedForeground, letterSpacing: 0.5,
  },
  scoreBarWrap: {
    width: '100%', height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden', marginTop: 4,
  },
  scoreBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  percentileRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(245, 197, 24, 0.06)',
    borderRadius: 8,
  },
  percentileText: {
    fontFamily: FONT_BODY, fontSize: 12, color: colors.primary, fontWeight: '600',
  },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8,
  },
  eventIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(245, 197, 24, 0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  eventIcon: { fontSize: 16 },
  eventMeta: { flex: 1, gap: 2 },
  eventDescription: {
    fontFamily: FONT_BODY, fontSize: 13, color: colors.foreground, lineHeight: 18,
  },
  eventDate: {
    fontFamily: FONT_BODY_REG, fontSize: 11, color: colors.mutedForeground,
  },
  eventPoints: {
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  eventPointsNegative: {
    backgroundColor: 'rgba(255, 69, 58, 0.10)',
  },
  eventPointsText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 12, fontWeight: '700',
    color: colors.status.success,
  },
  eventPointsTextNegative: { color: colors.destructive },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.input,
    borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  sportChipIcon: { fontSize: 14 },
  sportChipText: {
    fontFamily: FONT_BODY, fontSize: 12, color: colors.foreground,
  },
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

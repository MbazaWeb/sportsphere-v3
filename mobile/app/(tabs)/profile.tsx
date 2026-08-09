/**
 * Profile Screen
 * --------------
 * Own profile + Performance Card summary, pulled from /api/auth/me on boot
 * (already in the auth store). Includes logout and quick links.
 *
 * If not signed in, shows a sign-in CTA.
 */

import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Trophy, Settings, LogOut, BadgeCheck, MapPin, Calendar, BarChart3,
  Users, FileText, ChevronRight, Crown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import { colors } from '@sportsphere/design-system/tokens';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { useAuthStore } from '../../lib/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive', onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          await logout();
        },
      },
    ]);
  }, [logout]);

  if (!session || !user) {
    return (
      <View style={styles.container}>
        <Header title="Profile" />
        <View style={styles.signInWrap}>
          <GlassCard elevated style={styles.signInCard}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.signInTitle}>Join Sportsphere</Text>
            <Text style={styles.signInBody}>
              Sign in to see your profile, performance card, tier, ranking, and history.
            </Text>
            <Pressable style={styles.signInButton} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInButtonText}>Sign in</Text>
            </Pressable>
            <Pressable
              style={styles.signUpButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.signUpButtonText}>Create account</Text>
            </Pressable>
          </GlassCard>
        </View>
      </View>
    );
  }

  // Compute initials if no avatar
  const initials = user.avatar || user.name.slice(0, 2).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try { await useAuthStore.getState().fetchMe(); } catch {}
            setRefreshing(false);
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Header title="Profile" onTrophyPress={() => router.push('/leaderboard')} />

      {/* Profile card */}
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
              <Text style={styles.roleType}>{user.typeName ?? 'Casual Fan'}</Text>
            </View>
          </View>
        </View>

        {user.bio ? (
          <Text style={styles.bio}>{user.bio}</Text>
        ) : null}

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
          <Stat label="Posts"     value={user.postCount} />
          <Stat label="Followers" value={user.followerCount} />
          <Stat label="Following" value={user.followingCount} />
        </View>
      </GlassCard>

      {/* Sports following */}
      {user.sports && user.sports.length > 0 ? (
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sports you follow</Text>
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

      {/* Quick links */}
      <GlassCard style={styles.sectionCard}>
        <Pressable
          style={styles.linkRow}
          onPress={() => router.push('/leaderboard')}
        >
          <Trophy size={18} color={colors.primary} />
          <Text style={styles.linkText}>Leaderboard</Text>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          style={styles.linkRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            Alert.alert('Coming soon', 'Performance detail view is in development.');
          }}
        >
          <BarChart3 size={18} color={colors.accent} />
          <Text style={styles.linkText}>Performance card</Text>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          style={styles.linkRow}
          onPress={() => Alert.alert('Coming soon', 'Settings screen is in development.')}
        >
          <Settings size={18} color={colors.mutedForeground} />
          <Text style={styles.linkText}>Settings</Text>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
      </GlassCard>

      {/* Sign out */}
      <Pressable style={styles.signOutButton} onPress={handleLogout}>
        <LogOut size={16} color={colors.destructive} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{formatCount(value)}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  profileCard: { padding: 20, gap: 16, marginTop: 8 },
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
  statItem: { alignItems: 'center', gap: 2 },
  statValue: {
    fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: '700',
    color: colors.foreground,
  },
  statLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700',
    color: colors.mutedForeground, letterSpacing: 0.5,
  },
  sectionCard: { padding: 16, gap: 12, marginTop: 12 },
  sectionTitle: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
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
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 4,
  },
  linkText: {
    flex: 1, fontFamily: FONT_BODY, fontSize: 15, color: colors.foreground,
  },
  divider: {
    height: 1, backgroundColor: colors.border, marginVertical: 4,
  },
  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.20)',
  },
  signOutText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.destructive,
  },
  signInWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  signInCard: { padding: 32, alignItems: 'center', gap: 16, width: '100%', maxWidth: 360 },
  logoBadge: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: '700',
    color: colors.primaryForeground,
  },
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
    width: '100%', alignItems: 'center',
  },
  signInButtonText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 15, fontWeight: '700',
    color: colors.primaryForeground,
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12,
    width: '100%', alignItems: 'center',
  },
  signUpButtonText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 15, fontWeight: '700',
    color: colors.foreground,
  },
});

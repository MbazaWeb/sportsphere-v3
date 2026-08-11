/**
 * Profile Screen — matches web ProfileTab exactly
 * ----------------------------------------------
 * - Cover photo area (or gradient placeholder)
 * - Avatar 84px with gold ring if verified/pro
 * - Name, verified badge, PRO badge, handle
 * - Role icon/name/type
 * - Bio, location
 * - Stats row: Posts, Followers, Following
 * - Sports following section
 * - Sign out button
 */

import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Trophy, Settings, LogOut, BadgeCheck, MapPin, Calendar, BarChart3,
  ChevronRight, Crown, Camera, X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { useAuthStore } from '../../lib/authStore';

const GOLD = '#F5C518';
const BG = '#0A1628';
const BG_SECONDARY = '#0F1D3A';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

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
        <View style={styles.header}>
          <Text style={styles.wordmark}>Profile</Text>
        </View>
        <View style={styles.signInWrap}>
          <GlassCard elevated style={styles.signInCard}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.signInTitle}>Join SportSphere</Text>
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
          tintColor={GOLD}
        />
      }
    >
      {/* Cover photo area */}
      <View style={styles.coverArea}>
        <View style={styles.coverGradient} />\n        <Pressable style={styles.coverUpload}>
          <Camera size={16} color={FG} />
          <Text style={styles.coverUploadText}>Edit cover</Text>
        </Pressable>
      </View>

      {/* Avatar overlapping cover */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          <Avatar url={user.avatarUrl ?? undefined} size={84} goldRing={user.isVerified || !!user.isPro} />
        </View>
      </View>

      {/* Profile card */}
      <GlassCard elevated style={styles.profileCard}>
        {/* Name row with badges */}
        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>{user.name}</Text>
          {user.isVerified ? <BadgeCheck size={20} color={GOLD} /> : null}
          {user.isPro ? (
            <View style={styles.proBadge}>
              <Crown size={10} color="#0A1628" />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.handle}>{user.handle}</Text>

        {/* Role row */}
        <View style={styles.roleRow}>
          <Text style={styles.roleIcon}>{user.roleIcon ?? '⭐'}</Text>
          <Text style={styles.roleName}>{user.roleName ?? 'Fan'}</Text>
          <Text style={styles.roleSep}>·</Text>
          <Text style={styles.roleType}>{user.typeName ?? 'Casual Fan'}</Text>
        </View>

        {/* Bio */}
        {user.bio ? (
          <Text style={styles.bio}>{user.bio}</Text>
        ) : null}

        {/* Meta row: location, joined */}
        <View style={styles.metaRow}>
          {user.location ? (
            <View style={styles.metaItem}>
              <MapPin size={13} color={MUTED} />
              <Text style={styles.metaText}>{user.location}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Calendar size={13} color={MUTED} />
            <Text style={styles.metaText}>
              Joined {new Date(user.registeredAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Stats row: Posts, Followers, Following */}
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
        <Pressable style={styles.linkRow} onPress={() => router.push('/leaderboard')}>
          <Trophy size={18} color={GOLD} />
          <Text style={styles.linkText}>Leaderboard</Text>
          <ChevronRight size={18} color={MUTED} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.linkRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            Alert.alert('Coming soon', 'Performance detail view is in development.');
          }}
        >
          <BarChart3 size={18} color="#FF6B35" />
          <Text style={styles.linkText}>Performance card</Text>
          <ChevronRight size={18} color={MUTED} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.linkRow}
          onPress={() => Alert.alert('Coming soon', 'Settings screen is in development.')}
        >
          <Settings size={18} color={MUTED} />
          <Text style={styles.linkText}>Settings</Text>
          <ChevronRight size={18} color={MUTED} />
        </Pressable>
      </GlassCard>

      {/* Sign out */}
      <Pressable style={styles.signOutButton} onPress={handleLogout}>
        <LogOut size={16} color="#FF453A" />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <View style={{ height: 100 }} />
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

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  wordmark: { fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: '700', color: FG, letterSpacing: -0.5 },

  // Cover area
  coverArea: {
    height: 140, position: 'relative', overflow: 'hidden',
  },
  coverGradient: {
    flex: 1,
    backgroundColor: '#1A2A4A',
  },
  coverUpload: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.50)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  coverUploadText: { fontFamily: FONT_BODY_REG, fontSize: 12, color: FG },

  // Avatar section
  avatarSection: {
    alignItems: 'center', marginTop: -42, marginBottom: -8,
  },
  avatarWrap: {
    borderRadius: 50, borderWidth: 4, borderColor: BG,
  },

  content: { paddingHorizontal: 16, paddingBottom: 0 },

  // Profile card
  profileCard: { padding: 20, gap: 12, marginTop: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  displayName: {
    flexShrink: 1, fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: '700',
    color: FG, letterSpacing: -0.5,
  },
  handle: { fontFamily: FONT_BODY_REG, fontSize: 13, color: MUTED },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  roleIcon: { fontSize: 14 },
  roleName: {
    fontFamily: FONT_BODY_BOLD, fontSize: 12, fontWeight: '700',
    color: GOLD, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  roleSep: { color: MUTED, fontSize: 12 },
  roleType: { fontFamily: FONT_BODY_REG, fontSize: 12, color: MUTED },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FF6B35', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  proBadgeText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: '#0A1628', letterSpacing: 0.5,
  },
  bio: { fontFamily: FONT_BODY, fontSize: 14, lineHeight: 20, color: FG, marginTop: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: FONT_BODY_REG, fontSize: 12, color: MUTED },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: '700', color: FG },
  statLabel: { fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 0.5 },

  sectionCard: { padding: 16, gap: 12, marginTop: 12 },
  sectionTitle: { fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: FG },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: SURFACE, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: BORDER,
  },
  sportChipIcon: { fontSize: 14 },
  sportChipText: { fontFamily: FONT_BODY, fontSize: 12, color: FG },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  linkText: { flex: 1, fontFamily: FONT_BODY, fontSize: 15, color: FG },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 4 },

  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.20)',
  },
  signOutText: { fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: '#FF453A' },

  // Sign-in card
  signInWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  signInCard: { padding: 32, alignItems: 'center', gap: 16, width: '100%', maxWidth: 360 },
  logoBadge: {
    width: 56, height: 56, borderRadius: 14, backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: '700', color: '#0A1628' },
  signInTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: '700', color: FG, textAlign: 'center' },
  signInBody: { fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20, color: MUTED, textAlign: 'center' },
  signInButton: { backgroundColor: GOLD, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  signInButtonText: { fontFamily: FONT_BODY_BOLD, fontSize: 15, fontWeight: '700', color: '#0A1628' },
  signUpButton: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center',
  },
  signUpButtonText: { fontFamily: FONT_BODY_BOLD, fontSize: 15, fontWeight: '700', color: FG },
});

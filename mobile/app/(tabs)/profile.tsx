/**
 * Profile Screen
 * --------------
 * Placeholder for Phase C — user profile with role-aware tabs (player, coach, team).
 * Will use the shared @sportsphere/types ProfileConfig.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import { colors, typography } from '@sportsphere/design-system/tokens';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header title="Profile" showTrophy={false} showSearch={false} />
      <View style={styles.content}>
        <GlassCard elevated style={styles.profileCard}>
          <Avatar size={80} goldRing />
          <View style={styles.meta}>
            <Text style={styles.displayName}>Guest User</Text>
            <Text style={styles.handle}>@guest</Text>
          </View>
        </GlassCard>

        <Pressable
          style={styles.loginButton}
          onPress={() => {
            // Phase C: router.push('/(auth)/login')
          }}
        >
          <Text style={styles.loginButtonText}>Sign in or Create Account</Text>
        </Pressable>

        <GlassCard style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>Profile & Performance</Text>
          <Text style={styles.placeholderBody}>
            Once you sign in, your profile, performance card, tier, ranking, and history
            will appear here — same as the web app.
          </Text>
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  profileCard: {
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
  meta: {
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontFamily: typography.fontFamily.display.split(',')[0].replace(/'/g, ''),
    fontWeight: '700',
    fontSize: 22,
    color: colors.foreground,
  },
  handle: {
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    fontSize: 14,
    color: colors.mutedForeground,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    fontWeight: '700',
    fontSize: 15,
    color: colors.primaryForeground,
  },
  placeholder: {
    padding: 24,
    gap: 8,
  },
  placeholderTitle: {
    fontFamily: typography.fontFamily.display.split(',')[0].replace(/'/g, ''),
    fontWeight: '700',
    fontSize: 18,
    color: colors.foreground,
  },
  placeholderBody: {
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
  },
});

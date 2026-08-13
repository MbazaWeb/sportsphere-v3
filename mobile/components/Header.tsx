/**
 * Header — upgraded top bar with logo wordmark + actions
 * ----------------------------------------------------
 * Used at the top of each tab screen.
 */

import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Trophy, Search, Bell, ShoppingBag } from 'lucide-react-native';
import { colors, typography } from '@sportsphere/design-system/tokens';

interface HeaderProps {
  title?: string;
  showTrophy?: boolean;
  showSearch?: boolean;
  showBell?: boolean;
  onTrophyPress?: () => void;
  onSearchPress?: () => void;
  onBellPress?: () => void;
}

export default function Header({
  title,
  showTrophy = true,
  showSearch = true,
  showBell = false,
  onTrophyPress,
  onSearchPress,
  onBellPress,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        {title ? (
          <Text style={styles.wordmark}>{title}</Text>
        ) : (
          <Text style={styles.wordmark}>SportSphere</Text>
        )}
      </View>
      <View style={styles.actions}>
        {showSearch && (
          <Pressable onPress={onSearchPress} hitSlop={12} accessibilityLabel="Search" style={styles.iconBtn}>
            <Search color={colors.mutedForeground} size={20} />
          </Pressable>
        )}
        {showBell && (
          <Pressable onPress={onBellPress} hitSlop={12} accessibilityLabel="Notifications" style={styles.iconBtn}>
            <Bell color={colors.mutedForeground} size={20} />
            <View style={styles.notifDot} />
          </Pressable>
        )}
        {showTrophy && (
          <Pressable onPress={onTrophyPress} hitSlop={12} accessibilityLabel="Leaderboard" style={styles.iconBtn}>
            <Trophy color={colors.primary} size={20} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(10, 22, 40, 0.85)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  brand: { flex: 1 },
  wordmark: {
    fontFamily: typography.fontFamily.display.split(',')[0].replace(/'/g, ''),
    fontWeight: '700', fontSize: 22, letterSpacing: -0.5,
    color: colors.foreground,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 7, right: 7,
    width: 7, height: 7, borderRadius: 999,
    backgroundColor: colors.primary,
  },
});

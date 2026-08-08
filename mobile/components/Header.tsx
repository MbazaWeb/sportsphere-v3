/**
 * Header — top app bar with Sportsphere wordmark + actions
 * Used at the top of each tab screen.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Trophy, Search } from 'lucide-react-native';
import { colors, typography } from '@sportsphere/design-system/tokens';

interface HeaderProps {
  title?: string;
  showTrophy?: boolean;
  showSearch?: boolean;
  onTrophyPress?: () => void;
  onSearchPress?: () => void;
}

export default function Header({
  title = 'Sportsphere',
  showTrophy = true,
  showSearch = true,
  onTrophyPress,
  onSearchPress,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Text style={styles.wordmark}>{title}</Text>
      </View>
      <View style={styles.actions}>
        {showSearch && (
          <Pressable onPress={onSearchPress} hitSlop={12} accessibilityLabel="Search">
            <Search color={colors.foreground} size={22} />
          </Pressable>
        )}
        {showTrophy && (
          <Pressable onPress={onTrophyPress} hitSlop={12} accessibilityLabel="Leaderboard">
            <Trophy color={colors.primary} size={22} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brand: {
    flex: 1,
  },
  wordmark: {
    fontFamily: typography.fontFamily.display.split(',')[0].replace(/'/g, ''),
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.foreground,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});

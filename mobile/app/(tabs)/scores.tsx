/**
 * Scores Screen
 * -------------
 * Placeholder for Phase C — will show fixtures, standings, match details.
 * Mirrors the web ScoresTab.
 */

import { View, Text, StyleSheet } from 'react-native';
import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import { colors, typography } from '@sportsphere/design-system/tokens';

export default function ScoresScreen() {
  return (
    <View style={styles.container}>
      <Header title="Scores" showTrophy={false} />
      <View style={styles.content}>
        <GlassCard style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>Scores & Standings</Text>
          <Text style={styles.placeholderBody}>
            Live matches, fixtures, and league tables will appear here in Phase C.
            The mobile app will pull from the same /api/sports/* endpoints as the web app.
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
  },
  placeholder: {
    padding: 24,
    gap: 8,
  },
  placeholderTitle: {
    fontFamily: typography.fontFamily.display.split(',')[0].replace(/'/g, ''),
    fontWeight: '700',
    fontSize: 20,
    color: colors.foreground,
  },
  placeholderBody: {
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
  },
});

/**
 * Create Screen
 * -------------
 * Placeholder for Phase C — post composer, prediction creator, poll creator.
 */

import { View, Text, StyleSheet } from 'react-native';
import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import { colors, typography } from '@sportsphere/design-system/tokens';

export default function CreateScreen() {
  return (
    <View style={styles.container}>
      <Header title="Create" showTrophy={false} showSearch={false} />
      <View style={styles.content}>
        <GlassCard style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>Create</Text>
          <Text style={styles.placeholderBody}>
            Compose a post, prediction, or poll. Coming in Phase C.
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

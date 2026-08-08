/**
 * GlassCard — the signature Sportsphere card surface
 * ---------------------------------------------------
 * Mirrors the web `.glass-card` look:
 *   - translucent white overlay (5% opacity)
 *   - 1px subtle white border (8% opacity)
 *   - 12px radius
 *   - drop shadow for depth
 *
 * On RN we use elevation (Android) + shadowColor/Offset/Opacity (iOS).
 */

import { View, type ViewProps, StyleSheet } from 'react-native';
import { colors, radii, shadows } from '@sportsphere/design-system/tokens';

interface GlassCardProps extends ViewProps {
  /** Adds a hover-style elevated shadow + gold-tinted border */
  elevated?: boolean;
  /** Adds the rotating gradient border (.premium-glow-border on web) */
  premium?: boolean;
}

export default function GlassCard({
  style,
  elevated = false,
  premium = false,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <View
      style={[
        styles.base,
        elevated && styles.elevated,
        premium && styles.premium,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 32,
    // Android shadow
    elevation: 4,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: colors.cardHover,
    borderColor: 'rgba(245, 197, 24, 0.20)',
    shadowOpacity: 0.30,
    shadowRadius: 40,
    elevation: 6,
  },
  premium: {
    // Approximation of the web premium-glow-border.
    // On web it's an animated rotating gradient; on RN we use a static gold-tinted border.
    borderColor: 'rgba(245, 197, 24, 0.40)',
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
});

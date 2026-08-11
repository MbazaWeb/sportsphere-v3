/**
 * GlassCard — matches the web .glass-card exactly
 * ---------------------------------------------------
 *   - bg: rgba(255, 255, 255, 0.05)
 *   - border: 1px solid rgba(255, 255, 255, 0.08)
 *   - rounded-2xl (16px radius)
 *   - subtle shadow for depth
 *   - Optional elevated mode (brighter surface + gold-tinted border)
 *   - Optional premium mode (animated gold glow border approximation)
 */

import { View, type ViewProps, StyleSheet } from 'react-native';

interface GlassCardProps extends ViewProps {
  /** Adds elevated shadow + gold-tinted border */
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 3,
  },
  elevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(245, 197, 24, 0.20)',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 6,
  },
  premium: {
    borderColor: 'rgba(245, 197, 24, 0.40)',
    shadowColor: '#F5C518',
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
});

/**
 * Tailwind preset — shared between web and RN (NativeWind)
 * --------------------------------------------------------
 * Generates a Tailwind theme.extend object from the JS tokens in ./tokens.ts.
 *
 * Usage on web (Next.js):
 *   // tailwind.config.ts
 *   import preset from '@sportsphere/design-system/tailwind-preset'
 *   export default { presets: [preset], content: [...] }
 *
 * Usage on RN (NativeWind v4):
 *   // mobile/tailwind.config.ts
 *   import preset from '@sportsphere/design-system/tailwind-preset'
 *   export default { presets: [preset], content: [...] }
 */

import { colors, radii, typography, shadows } from './tokens.js';

export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background:           colors.background,
        backgroundSecondary:  colors.backgroundSecondary,
        foreground:           colors.foreground,

        primary: {
          DEFAULT:    colors.primary,
          foreground: colors.primaryForeground,
          dark:       colors.primaryDark,
          light:      colors.primaryLight,
        },
        accent: {
          DEFAULT:    colors.accent,
          foreground: colors.accentForeground,
        },

        card: {
          DEFAULT:    colors.card,
          foreground: colors.cardForeground,
          border:     colors.cardBorder,
          hover:      colors.cardHover,
        },

        muted: {
          DEFAULT:    colors.muted,
          foreground: colors.mutedForeground,
        },

        destructive: {
          DEFAULT:    colors.destructive,
          foreground: colors.destructiveForeground,
        },

        border: colors.border,
        input:  colors.input,
        ring:   colors.ring,

        // Sportsphere-specific brand aliases
        gold:     colors.primary,
        surface:  colors.card,
        'surface-elevated': colors.cardHover,
        'surface-border':   colors.cardBorder,

        status: colors.status,
        tier:   colors.tier,
      },
      borderRadius: {
        lg: radii.lg,
        md: radii.md,
        sm: radii.sm,
        xl: radii.xl,
      },
      fontFamily: {
        display: typography.fontFamily.display.split(',')[0].replace(/'/g, ''),
        sans:    typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
        mono:    typography.fontFamily.mono.split(',')[0].replace(/'/g, ''),
      },
      boxShadow: {
        card:      shadows.card,
        'card-hover': shadows.cardHover,
        gold:      shadows.gold,
        'gold-hover': shadows.goldHover,
      },
    },
  },
};

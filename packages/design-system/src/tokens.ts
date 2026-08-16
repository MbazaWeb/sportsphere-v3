/**
 * Sportsphere Design Tokens — platform-agnostic
 * ----------------------------------------------
 * Single source of truth for brand colors, typography, spacing, radii.
 *
 * Consumed by:
 *   - Web:  Tailwind v4 CSS variables (see ./tailwind-preset.ts and the
 *           existing src/app/globals.css which mirrors these values)
 *   - RN:   NativeWind v4 + StyleSheet.create (see mobile/tailwind.config.ts)
 *
 * NOTE: keep this file side-effect free and web/RN agnostic. No `window`,
 * no `process`, no React imports. Pure data.
 */

export const colors = {
  /** Deep navy backdrop — main app background */
  background:        '#0A1628',
  /** Slightly lighter navy — used for hero gradients */
  backgroundSecondary:'#0F1D3A',
  /** Hero gradient stop */
  heroGradientStart: '#1A2A4A',
  heroGradientEnd:   '#0A1628',

  foreground:        '#FFFFFF',

  /** Gold — primary brand color */
  primary:           '#F5C518',
  primaryForeground: '#0A1628',
  primaryDark:       '#D4A800',
  primaryLight:      '#FFD700',

  /** Vibrant orange — accent */
  accent:            '#FF6B35',
  accentForeground:  '#FFFFFF',
  accentGlow:        'rgba(255, 107, 53, 0.20)',

  /** Glass cards (translucent white overlays) */
  card:              'rgba(255, 255, 255, 0.05)',
  cardForeground:    '#FFFFFF',
  cardBorder:        'rgba(255, 255, 255, 0.08)',
  cardHover:         'rgba(255, 255, 255, 0.08)',

  /** Muted text + surfaces */
  muted:             'rgba(255, 255, 255, 0.05)',
  mutedForeground:   'rgba(255, 255, 255, 0.50)',

  destructive:       '#FF453A',
  destructiveForeground: '#FFFFFF',

  border:            'rgba(255, 255, 255, 0.08)',
  input:             'rgba(255, 255, 255, 0.08)',
  ring:              '#F5C518',

  /** Status palette (used for KPI categories, performance tiers, etc.) */
  status: {
    success: '#10B981', // emerald
    warning: '#F59E0B', // amber
    danger:  '#EF4444', // red
    info:    '#3B82F6', // blue
    premium: '#A855F7', // violet
  },

  /** Performance tier colors (mirrors src/lib/performance-engine/tiers.ts) */
  tier: {
    bronze:   '#CD7F32',
    silver:   '#C0C0C0',
    gold:     '#F5C518',
    platinum: '#E5E4E2',
    diamond:  '#B9F2FF',
    elite:    '#FF6B35',
  },

  /** KPI category palette (mirrors src/app/admin/kpi/page.tsx) */
  kpiCategory: {
    Attacking:    '#F59E0B',
    Possession:   '#3B82F6',
    Defending:    '#10B981',
    Goalkeeping:  '#A855F7',
    Discipline:   '#EF4444',
    SetPieces:    '#8B5CF6',
    Results:      '#F59E0B',
    Form:         '#3B82F6',
    Defense:      '#10B981',
    Attack:       '#8B5CF6',
  },
} as const;

export const gradients = {
  /** Hero gold→orange — primary brand gradient */
  gold:        'linear-gradient(135deg, #F5C518 0%, #FF6B35 100%)',
  goldSubtle:  'linear-gradient(135deg, rgba(245, 197, 24, 0.08), rgba(255, 107, 53, 0.03))',
  hero:        'linear-gradient(135deg, #1A2A4A 0%, #0A1628 100%)',
  /** Body backdrop — radial navy gradient */
  body:        'radial-gradient(ellipse at top, #0F1D3A, #0A1628)',
  textGold:    'linear-gradient(135deg, #F5C518, #FFD700)',
  textSport:   'linear-gradient(135deg, #F5C518, #FF6B35)',
} as const;

export const radii = {
  sm:   8,    // 0.5rem
  md:   10,   // 0.625rem
  lg:   12,   // 0.75rem  ← default card radius
  xl:   16,   // 1rem
  '2xl': 20,  // 1.25rem
  full: 9999,
} as const;

export const spacing = {
  /** 4px grid */
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24,
  8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96,
} as const;

export const typography = {
  fontFamily: {
    display: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
    body:    "'Inter', system-ui, -apple-system, sans-serif",
    mono:    "'Sarasa Mono SC', ui-monospace, SFMono-Regular, monospace",
  },
  heading: {
    fontWeight: '700',
    letterSpacing: -0.02,
  },
  sizes: {
    xs:   12,
    sm:   14,
    base: 16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
} as const;

export const shadows = {
  /** Glass card shadow */
  card:    '0 8px 32px rgba(0, 0, 0, 0.20)',
  cardHover:'0 12px 40px rgba(0, 0, 0, 0.30)',
  /** Gold glow for primary CTAs / featured items */
  gold:    '0 0 30px rgba(245, 197, 24, 0.15)',
  goldHover:'0 0 50px rgba(245, 197, 24, 0.25)',
} as const;

export const animation = {
  duration: {
    fast:   150,
    base:   200,
    slow:   300,
    slower: 400,
  },
  spring: {
    stiffness: 500,
    damping:   30,
  },
} as const;

export type DesignTokens = {
  colors: typeof colors;
  gradients: typeof gradients;
  radii: typeof radii;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof shadows;
  animation: typeof animation;
};

export const tokens: DesignTokens = {
  colors,
  gradients,
  radii,
  spacing,
  typography,
  shadows,
  animation,
};

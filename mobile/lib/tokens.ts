/** Minimal brand tokens */
export const colors = {
  background: "#0A1628",
  backgroundSecondary: "#0F1D3A",
  heroGradientStart: "#1A2A4A",
  heroGradientEnd: "#0A1628",
  foreground: "#FFFFFF",
  primary: "#F5C518",
  primaryForeground: "#0A1628",
  primaryDark: "#D4A800",
  primaryLight: "#FFD700",
  accent: "#FF6B35",
  accentForeground: "#FFFFFF",
  accentGlow: "rgba(255, 107, 53, 0.20)",
  card: "rgba(255, 255, 255, 0.05)",
  cardForeground: "#FFFFFF",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  cardHover: "rgba(255, 255, 255, 0.08)",
  muted: "rgba(255, 255, 255, 0.05)",
  mutedForeground: "rgba(255, 255, 255, 0.50)",
  destructive: "#FF453A",
  destructiveForeground: "#FFFFFF",
  border: "rgba(255, 255, 255, 0.08)",
  input: "rgba(255, 255, 255, 0.08)",
  ring: "#F5C518",
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
    premium: "#A855F7",
  },
  tier: {
    bronze: "#CD7F32",
    silver: "#C0C0C0",
    gold: "#F5C518",
    platinum: "#E5E4E2",
    diamond: "#B9F2FF",
    elite: "#FF6B35",
  },
} as const;

export const radii = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const typography = {
  fontFamily: {
    display: "System",
    body: "System",
  },
  display: { fontSize: 28, fontWeight: "700" as const, fontFamily: "System" },
  title: { fontSize: 20, fontWeight: "600" as const, fontFamily: "System" },
  body: { fontSize: 16, fontWeight: "400" as const, fontFamily: "System" },
  caption: { fontSize: 12, fontWeight: "400" as const, fontFamily: "System" },
} as const;

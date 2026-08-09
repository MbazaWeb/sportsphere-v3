/**
 * Font helper — exports pre-resolved family names from the loaded
 * expo-google-fonts. Because we call useFonts() in _layout.tsx before
 * any screen renders, these are safe to use directly in StyleSheet.create.
 */
import { typography } from '@sportsphere/design-system/tokens';

// On RN, expo-google-fonts loads fonts with system names matching the
// imported constant. We map our design-system typography slots to those.
export const FONT_DISPLAY = 'Outfit_700Bold';
export const FONT_DISPLAY_MED = 'Outfit_600SemiBold';
export const FONT_BODY = 'Inter_500Medium';
export const FONT_BODY_REG = 'Inter_400Regular';
export const FONT_BODY_BOLD = 'Inter_700Bold';

// Fallback object that styles can spread when they only need family + weight.
export const fontStyles = {
  display: { fontFamily: FONT_DISPLAY },
  displayMed: { fontFamily: FONT_DISPLAY_MED },
  body: { fontFamily: FONT_BODY },
  bodyReg: { fontFamily: FONT_BODY_REG },
  bodyBold: { fontFamily: FONT_BODY_BOLD },
};

// Re-export typography for legacy code that still references it.
export { typography };

/**
 * Auth route group layout
 * -----------------------
 * No tab bar — full-screen modal-style auth flow.
 */

import { Stack } from 'expo-router';
import { colors } from '@sportsphere/design-system/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

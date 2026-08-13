/**
 * Sportsphere Mobile — Root Layout
 * --------------------------------
 * Loads fonts, applies brand background, sets up SafeArea + status bar.
 * Boots the auth store (calls /api/auth/me) and gates routes: if no session
 * and not on an auth screen, redirect to login.
 */

import '../global.css';

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

import { colors } from '@sportsphere/design-system/tokens';
import { useAuthStore } from '../lib/authStore';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useRealtime } from '../hooks/useRealtime';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const router = useRouter();
  const segments = useSegments();
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  // Initialize push notifications & deep linking response handling
  usePushNotifications(session?.user?.id);

  // Initialize Real-time WebSockets
  useRealtime();

  // Boot: try to rehydrate the session from SecureStore.
  useEffect(() => {
    fetchMe().catch(() => {});
  }, [fetchMe]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Auth gate: redirect between (auth) and (tabs) based on session presence.
  useEffect(() => {
    if (!initialized || !fontsLoaded) return;
    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!session && !inAuthGroup) {
      // Not signed in — go to login.
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Signed in but still on auth screen — go to tabs.
      router.replace('/(tabs)');
    }
  }, [session, initialized, fontsLoaded, segments, router]);

  if (!fontsLoaded && !fontError) {
    return null;  // splash screen still visible
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="player/[id]" />
        <Stack.Screen name="performance/[userId]" />
        <Stack.Screen name="messages/[partnerId]" />
        <Stack.Screen name="p/[id]" />
        <Stack.Screen name="u/[handle]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaProvider>
  );
}

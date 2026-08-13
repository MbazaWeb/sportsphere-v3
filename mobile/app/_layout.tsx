/**
 * Sportsphere Mobile — Root Layout (minimal APK build)
 */
import "../global.css";

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import { colors } from "../lib/tokens";
import { useAuthStore } from "../lib/authStore";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useRealtime } from "../hooks/useRealtime";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  usePushNotifications(session?.user?.id);
  useRealtime();

  useEffect(() => {
    fetchMe().catch(() => {});
    SplashScreen.hideAsync().catch(() => {});
  }, [fetchMe]);

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = (segments[0] as string) === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [initialized, session, segments, router]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaProvider>
  );
}

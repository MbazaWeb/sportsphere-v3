import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { profileApi } from '../../lib/api';

const GOLD = '#F5C518';
const BG = '#0A1628';

export default function UserHandleRedirect() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;

    const resolveHandle = async () => {
      try {
        // Ensure handle has @ prefix for the API if it's missing from URL
        const normalizedHandle = handle.startsWith('@') ? handle : `@${handle}`;
        const user = await profileApi.getByHandle(normalizedHandle);
        if (user?.id) {
          router.replace(`/player/${user.id}`);
        } else {
          setError('User not found');
        }
      } catch (err: any) {
        setError(err?.message ?? 'Failed to resolve user');
      }
    };

    resolveHandle();
  }, [handle]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.backText}>Back to Home</Text>
          </Pressable>
        </View>
      ) : (
        <ActivityIndicator color={GOLD} size="large" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center', padding: 20 },
  errorText: { color: '#ffffff', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  backButton: { backgroundColor: GOLD, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backText: { color: '#0A1628', fontWeight: '700' },
});

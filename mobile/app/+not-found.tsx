import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../lib/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back to Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontFamily: typography.fontFamily.display.split(',')[0].replace(/'/g, ''),
    fontWeight: '700',
    fontSize: 24,
    color: colors.foreground,
  },
  link: {
    padding: 12,
  },
  linkText: {
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

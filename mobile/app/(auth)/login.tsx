/**
 * Login Screen
 * ------------
 * Email or handle + password. On success, the auth store session is set
 * and the RootLayout gating will redirect to (tabs).
 */

import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, BadgeCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors } from '@sportsphere/design-system/tokens';
import { useAuthStore } from '../../lib/authStore';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_REG, FONT_BODY_BOLD } from '../../lib/fonts';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = identifier.trim().length > 0 && password.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await login(identifier.trim(), password);
      // RootLayout gating will handle the redirect; nudge back to be safe.
      router.replace('/(tabs)');
    } catch (err: any) {
      // Error already in store; surface via Alert for clarity.
      Alert.alert('Sign in failed', err?.message ?? 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brandBlock}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to Sportsphere to follow your favourite athletes, predict scores, and climb the leaderboard.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FieldLabel>Email or handle</FieldLabel>
          <View style={styles.inputWrap}>
            <Mail size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={(v) => { setIdentifier(v); if (error) clearError(); }}
              placeholder="you@example.com or @yourhandle"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <FieldLabel style={{ marginTop: 16 }}>Password</FieldLabel>
          <View style={styles.inputWrap}>
            <Lock size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(v) => { setPassword(v); if (error) clearError(); }}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={12}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword
                ? <EyeOff size={18} color={colors.mutedForeground} />
                : <Eye size={18} color={colors.mutedForeground} />}
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            disabled={!canSubmit || loading}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Text style={styles.submitText}>Sign in</Text>
                <ArrowRight size={18} color={colors.primaryForeground} />
              </>
            )}
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>New to Sportsphere?</Text>
            <Link href="/(auth)/register" asChild>
              <Pressable hitSlop={12}>
                <Text style={styles.signupLink}> Create account</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Trust signals */}
        <View style={styles.trustRow}>
          <BadgeCheck size={14} color={colors.primary} />
          <Text style={styles.trustText}>Live on the Sportsphere Performance Engine</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.fieldLabel, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    flexGrow: 1,
  },
  brandBlock: { alignItems: 'center', gap: 12, marginBottom: 32 },
  logoBadge: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: '700',
    color: colors.primaryForeground,
  },
  title: {
    fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: '700',
    color: colors.foreground, letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20,
    color: colors.mutedForeground, textAlign: 'center', paddingHorizontal: 16,
  },
  form: { gap: 0 },
  fieldLabel: {
    fontFamily: FONT_BODY, fontSize: 13, fontWeight: '600',
    color: colors.mutedForeground, marginBottom: 8, marginLeft: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.input,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, fontFamily: FONT_BODY, fontSize: 15,
    color: colors.foreground, padding: 0,
  },
  errorBanner: {
    marginTop: 16, padding: 12, borderRadius: 10,
    backgroundColor: 'rgba(255, 69, 58, 0.10)',
    borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.30)',
  },
  errorText: {
    fontFamily: FONT_BODY, fontSize: 13, color: colors.destructive,
  },
  submitButton: {
    marginTop: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    height: 54, borderRadius: 14,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 16, fontWeight: '700',
    color: colors.primaryForeground,
  },
  signupRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontFamily: FONT_BODY_REG, fontSize: 14, color: colors.mutedForeground,
  },
  signupLink: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.primary,
  },
  trustRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 32,
  },
  trustText: {
    fontFamily: FONT_BODY_REG, fontSize: 12,
    color: colors.mutedForeground,
  },
});

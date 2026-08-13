/**
 * Login Screen — matches web LoginModal exactly
 * -----------------------------------------------
 * - Dark glass card with rounded-3xl
 * - SportSphere logo at top
 * - "Sign In" title with X close button
 * - Email or Handle input field
 * - Password input with "Forgot password?" link
 * - Gold "Sign In" button with shadow
 * - "No account? Create one" link at bottom
 */

import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, BadgeCheck, X } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';

import { useAuthStore } from '../../lib/authStore';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_REG, FONT_BODY_BOLD } from '../../lib/fonts';

const GOLD = '#F5C518';
const BG = '#0A1628';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

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
      router.replace('/(tabs)');
    } catch (err: any) {
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
        {/* Close button */}
        <View style={styles.closeRow}>
      <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={12} style={styles.closeButton}>
        <X color={FG} size={22} />
      </Pressable>
        </View>

        {/* Glass card container */}
        <View style={styles.card}>
          {/* SportSphere logo */}
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>S</Text>
          </View>

          {/* Sign In title */}
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            Welcome back to SportSphere
          </Text>

          {/* Email or Handle */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Email or Handle</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={(v) => { setIdentifier(v); if (error) clearError(); }}
                placeholder="you@example.com or @yourhandle"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldBlock}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.fieldLabel}>Password</Text>
              <Pressable hitSlop={8}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </Pressable>
            </View>
            <View style={styles.inputWrap}>
              <Lock size={18} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => { setPassword(v); if (error) clearError(); }}
                placeholder="••••••••"
                placeholderTextColor={MUTED}
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
                  ? <EyeOff size={18} color={MUTED} />
                  : <Eye size={18} color={MUTED} />}
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Gold Sign In button with shadow */}
          <Pressable
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            disabled={!canSubmit || loading}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#0A1628" />
            ) : (
              <Text style={styles.submitText}>Sign In</Text>
            )}
          </Pressable>

          {/* Create account link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>No account? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable hitSlop={12}>
                <Text style={styles.signupLink}>Create one</Text>
              </Pressable>
            </Link>
          </View>

          {/* Trust signal */}
          <View style={styles.trustRow}>
            <BadgeCheck size={14} color={GOLD} />
            <Text style={styles.trustText}>Live on the SportSphere Performance Engine</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  closeRow: {
    position: 'absolute', top: 48, right: 24, zIndex: 10,
  },
  closeButton: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  // Glass card
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 24,
    padding: 28,
    gap: 20,
    // Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 32,
    elevation: 6,
  },
  // Logo
  logoBadge: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },
  logoText: {
    fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: '700', color: '#0A1628',
  },
  title: {
    fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: '700',
    color: FG, textAlign: 'center', letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20,
    color: MUTED, textAlign: 'center',
  },
  fieldBlock: { gap: 8 },
  fieldLabel: {
    fontFamily: FONT_BODY, fontSize: 13, fontWeight: '600',
    color: MUTED, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  passwordLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  forgotLink: {
    fontFamily: FONT_BODY_BOLD, fontSize: 12, fontWeight: '700', color: GOLD,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, fontFamily: FONT_BODY, fontSize: 15, color: FG, padding: 0,
  },
  errorBanner: {
    padding: 12, borderRadius: 10,
    backgroundColor: 'rgba(255, 69, 58, 0.10)',
    borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.30)',
  },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, color: '#FF453A' },
  submitButton: {
    backgroundColor: GOLD,
    height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 16, fontWeight: '700', color: '#0A1628',
  },
  signupRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  signupText: { fontFamily: FONT_BODY_REG, fontSize: 14, color: MUTED },
  signupLink: { fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: GOLD },
  trustRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  trustText: { fontFamily: FONT_BODY_REG, fontSize: 12, color: MUTED },
});

/**
 * Register Screen — matches web RegistrationFanStep exactly
 * ----------------------------------------------------------
 * - "Join SportSphere" title with X close button
 * - Fan/PRO toggle (gold active)
 * - Full Name, Email, Handle (auto-generated from name), Password, Confirm Password
 * - Sports selection (optional chips)
 * - Gold "Create Fan Account" button
 */

import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Mail, Lock, User, AtSign, Eye, EyeOff, X, Check, Crown, UserCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../../lib/authStore';
import { sportsApi } from '../../lib/api';
import type { Sport } from '@sportsphere/api-client';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_REG, FONT_BODY_BOLD } from '../../lib/fonts';

const GOLD = '#F5C518';
const BG = '#0A1628';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE_RE = /^@?[a-zA-Z0-9_]{3,30}$/;

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [accountType, setAccountType] = useState<'fan' | 'pro'>('fan');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  // Pull the live seeded sport list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await sportsApi.list();
        if (!cancelled) setSports(list);
      } catch (err) {
        console.warn('Failed to load sports:', err);
      } finally {
        if (!cancelled) setSportsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-generate handle from name
  useEffect(() => {
    if (name.trim().length > 0) {
      const generated = name.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '').slice(0, 20);
      if (generated.length >= 3) {
        setHandle(generated);
      }
    }
  }, [name]);

  const toggleSport = (slug: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 5 ? [...prev, slug] : prev,
    );
  };

  const formattedHandle = handle.startsWith('@') ? handle : handle ? `@${handle}` : '';
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const valid =
    name.trim().length > 0 &&
    EMAIL_RE.test(email) &&
    HANDLE_RE.test(formattedHandle) &&
    password.length >= 8 &&
    passwordsMatch;

  const handleSubmit = async () => {
    if (!valid || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        handle: formattedHandle,
        password,
        sports: selectedSlugs,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Sign up failed', err?.message ?? 'Please try again.');
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

        {/* Glass card */}
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>Join SportSphere</Text>
          <Text style={styles.subtitle}>
            Create your account and start connecting with sports fans worldwide.
          </Text>

          {/* Fan / PRO toggle */}
          <View style={styles.toggleContainer}>
            <Pressable
              style={[styles.toggleOption, accountType === 'fan' && styles.toggleOptionActive]}
              onPress={() => setAccountType('fan')}
            >
              <UserCheck size={18} color={accountType === 'fan' ? '#0A1628' : MUTED} />
              <Text style={[styles.toggleOptionText, accountType === 'fan' && styles.toggleOptionTextActive]}>Fan</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleOption, accountType === 'pro' && styles.toggleOptionActive]}
              onPress={() => setAccountType('pro')}
            >
              <Crown size={18} color={accountType === 'pro' ? '#0A1628' : MUTED} />
              <Text style={[styles.toggleOptionText, accountType === 'pro' && styles.toggleOptionTextActive]}>PRO</Text>
            </Pressable>
          </View>

          {/* Full Name */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrap}>
              <User size={18} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(v) => { setName(v); if (error) clearError(); }}
                placeholder="Marcus R."
                placeholderTextColor={MUTED}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); if (error) clearError(); }}
                placeholder="you@example.com"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Handle (auto-generated) */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Handle</Text>
            <View style={styles.inputWrap}>
              <AtSign size={18} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={handle}
                onChangeText={(v) => { setHandle(v.replace(/[^a-zA-Z0-9_]/g, '')); if (error) clearError(); }}
                placeholder="yourhandle"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            <Text style={styles.hint}>Auto-generated from your name · 3–30 characters</Text>
          </View>

          {/* Password */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => { setPassword(v); if (error) clearError(); }}
                placeholder="At least 8 characters"
                placeholderTextColor={MUTED}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
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

          {/* Confirm Password */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); if (error) clearError(); }}
                placeholder="Re-enter password"
                placeholderTextColor={MUTED}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
              />
            </View>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.mismatchText}>Passwords do not match</Text>
            )}
          </View>

          {/* Sports picker */}
          <View style={styles.sportsBlock}>
            <View style={styles.sportsHeader}>
              <Text style={styles.sportsTitle}>Favourite sports (optional)</Text>
              <Text style={styles.sportsCount}>{selectedSlugs.length} selected</Text>
            </View>
            {sportsLoading ? (
              <ActivityIndicator color={GOLD} style={{ paddingVertical: 20 }} />
            ) : sports.length === 0 ? (
              <Text style={styles.emptyText}>No sports available.</Text>
            ) : (
              <View style={styles.sportsGrid}>
                {sports.map((sport) => {
                  const selected = selectedSlugs.includes(sport.slug);
                  return (
                    <Pressable
                      key={sport.id}
                      onPress={() => toggleSport(sport.slug)}
                      style={[styles.sportChip, selected && styles.sportChipSelected]}
                    >
                      {selected ? <Check size={14} color="#0A1628" /> : null}
                      <Text style={[styles.sportChipText, selected && styles.sportChipTextSelected]}>
                        {sport.icon ? `${sport.icon} ` : ''}{sport.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <Pressable
            style={[styles.submitButton, !valid && styles.submitButtonDisabled]}
            disabled={!valid || loading}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#0A1628" />
            ) : (
              <Text style={styles.submitText}>
                Create {accountType === 'pro' ? 'PRO' : 'Fan'} Account
              </Text>
            )}
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable hitSlop={12}>
                <Text style={styles.signupLink}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: {
    paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40, flexGrow: 1, justifyContent: 'center',
  },
  closeRow: { position: 'absolute', top: 48, right: 24, zIndex: 10 },
  closeButton: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1, borderColor: BORDER, borderRadius: 24,
    padding: 28, gap: 16,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30, shadowRadius: 32, elevation: 6,
  },
  title: {
    fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: '700', color: FG, letterSpacing: -0.5,
  },
  subtitle: { fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20, color: MUTED },
  // Fan/PRO toggle
  toggleContainer: {
    flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 3,
  },
  toggleOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  toggleOptionActive: { backgroundColor: GOLD },
  toggleOptionText: { fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: MUTED },
  toggleOptionTextActive: { color: '#0A1628' },
  fieldBlock: { gap: 8 },
  fieldLabel: {
    fontFamily: FONT_BODY, fontSize: 13, fontWeight: '600',
    color: MUTED, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: FONT_BODY, fontSize: 15, color: FG, padding: 0 },
  hint: { fontFamily: FONT_BODY_REG, fontSize: 11, color: MUTED, marginTop: 4, marginLeft: 4 },
  mismatchText: { fontFamily: FONT_BODY_REG, fontSize: 11, color: '#FF453A', marginTop: 4, marginLeft: 4 },
  sportsBlock: { marginTop: 4 },
  sportsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sportsTitle: { fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: FG },
  sportsCount: { fontFamily: FONT_BODY_REG, fontSize: 12, color: MUTED },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
  },
  sportChipSelected: { backgroundColor: GOLD, borderColor: GOLD },
  sportChipText: { fontFamily: FONT_BODY, fontSize: 13, color: FG },
  sportChipTextSelected: { fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '700', color: '#0A1628' },
  emptyText: { fontFamily: FONT_BODY_REG, fontSize: 13, color: MUTED, paddingVertical: 12 },
  errorBanner: {
    padding: 12, borderRadius: 10,
    backgroundColor: 'rgba(255, 69, 58, 0.10)', borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.30)',
  },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, color: '#FF453A' },
  submitButton: {
    backgroundColor: GOLD, height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 12, elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { fontFamily: FONT_BODY_BOLD, fontSize: 16, fontWeight: '700', color: '#0A1628' },
  signupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  signupText: { fontFamily: FONT_BODY_REG, fontSize: 14, color: MUTED },
  signupLink: { fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: GOLD },
});

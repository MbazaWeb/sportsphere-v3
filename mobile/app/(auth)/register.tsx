/**
 * Register Screen
 * ---------------
 * Creates a new Fan account. Picks 1-3 favourite sports from the
 * live /api/sports seed list (not mock data).
 */

import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Mail, Lock, User, AtSign, Eye, EyeOff, ArrowRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors } from '@sportsphere/design-system/tokens';
import { useAuthStore } from '../../lib/authStore';
import { sportsApi } from '../../lib/api';
import type { Sport } from '@sportsphere/api-client';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_REG, FONT_BODY_BOLD } from '../../lib/fonts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE_RE = /^@?[a-zA-Z0-9_]{3,30}$/;

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  // Pull the live seeded sport list (no mock).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await sportsApi.list();
        if (!cancelled) {
          setSports(list);
        }
      } catch (err) {
        // Soft failure — registration can still proceed without sports.
        console.warn('Failed to load sports:', err);
      } finally {
        if (!cancelled) setSportsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleSport = (slug: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 3 ? [...prev, slug] : prev,
    );
  };

  const formattedHandle = handle.startsWith('@') ? handle : handle ? `@${handle}` : '';
  const valid =
    name.trim().length > 0 &&
    EMAIL_RE.test(email) &&
    HANDLE_RE.test(formattedHandle) &&
    password.length >= 8;

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
        {/* Brand */}
        <View style={styles.brandBlock}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join Sportsphere to track your performance, predict matches, and connect with athletes worldwide.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FieldLabel>Display name</FieldLabel>
          <View style={styles.inputWrap}>
            <User size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(v) => { setName(v); if (error) clearError(); }}
              placeholder="Marcus R."
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <FieldLabel style={{ marginTop: 16 }}>Email</FieldLabel>
          <View style={styles.inputWrap}>
            <Mail size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(v) => { setEmail(v); if (error) clearError(); }}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <FieldLabel style={{ marginTop: 16 }}>Handle</FieldLabel>
          <View style={styles.inputWrap}>
            <AtSign size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={handle}
              onChangeText={(v) => { setHandle(v.replace(/[^a-zA-Z0-9_]/g, '')); if (error) clearError(); }}
              placeholder="yourhandle"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
          <Hint>3–30 letters, numbers, or underscores.</Hint>

          <FieldLabel style={{ marginTop: 16 }}>Password</FieldLabel>
          <View style={styles.inputWrap}>
            <Lock size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(v) => { setPassword(v); if (error) clearError(); }}
              placeholder="At least 8 characters"
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

          {/* Sports picker */}
          <View style={styles.sportsBlock}>
            <View style={styles.sportsHeader}>
              <Text style={styles.sportsTitle}>Favourite sports</Text>
              <Text style={styles.sportsCount}>{selectedSlugs.length}/3 selected</Text>
            </View>
            {sportsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
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
                      style={[
                        styles.sportChip,
                        selected && styles.sportChipSelected,
                      ]}
                    >
                      {selected ? (
                        <Check size={14} color={colors.primaryForeground} />
                      ) : null}
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

          <Pressable
            style={[styles.submitButton, !valid && styles.submitButtonDisabled]}
            disabled={!valid || loading}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Text style={styles.submitText}>Create account</Text>
                <ArrowRight size={18} color={colors.primaryForeground} />
              </>
            )}
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable hitSlop={12}>
                <Text style={styles.signupLink}> Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.fieldLabel, style]}>{children}</Text>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    flexGrow: 1,
  },
  brandBlock: { gap: 8, marginBottom: 28 },
  title: {
    fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: '700',
    color: colors.foreground, letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FONT_BODY_REG, fontSize: 14, lineHeight: 20,
    color: colors.mutedForeground,
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
  hint: {
    fontFamily: FONT_BODY_REG, fontSize: 11,
    color: colors.mutedForeground, marginTop: 6, marginLeft: 4,
  },
  sportsBlock: { marginTop: 24 },
  sportsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  sportsTitle: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
  sportsCount: {
    fontFamily: FONT_BODY_REG, fontSize: 12,
    color: colors.mutedForeground,
  },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.input,
    borderWidth: 1, borderColor: colors.border,
  },
  sportChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sportChipText: {
    fontFamily: FONT_BODY, fontSize: 13, color: colors.foreground,
  },
  sportChipTextSelected: {
    color: colors.primaryForeground, fontWeight: '700',
  },
  emptyText: {
    fontFamily: FONT_BODY_REG, fontSize: 13, color: colors.mutedForeground,
    paddingVertical: 12,
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
});

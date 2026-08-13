/**
 * Create Screen
 * -------------
 * Post composer — text + post type + hashtags + (later) media upload.
 * Submits to /api/posts and pops back to Home on success.
 *
 * Also offers quick links to create a Poll or Prediction (future phases).
 */

import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Send, Hash, Image as ImageIcon, Vote, BarChart3, AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import { colors } from '@sportsphere/design-system/tokens';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { postsApi } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import type { ApiError } from '@sportsphere/api-client';

type PostType = 'post' | 'prediction' | 'poll' | 'highlight';

const POST_TYPES: { id: PostType; label: string; icon: any; description: string }[] = [
  { id: 'post',       label: 'Post',       icon: Send,        description: 'Share a thought, news, or update.' },
  { id: 'prediction', label: 'Prediction', icon: BarChart3,   description: 'Predict the score of an upcoming match.' },
  { id: 'poll',       label: 'Poll',       icon: Vote,        description: 'Ask the community a question.' },
  { id: 'highlight',  label: 'Highlight',  icon: ImageIcon,   description: 'Share a clip or photo from a match.' },
];

const MAX_CHARS = 500;

export default function CreateScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');

  const [selectedType, setSelectedType] = useState<PostType>('post');
  const [isBreaking, setIsBreaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_CHARS - content.length;
  const canSubmit = content.trim().length > 0 && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSubmitting(true);
    setError(null);
    try {
      const tags = hashtags
        .split(/[,\s]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean);
      await postsApi.create({
        content: content.trim(),
        postType: selectedType === 'highlight' ? 'spotlight' : selectedType,
        hashtags: tags,
        isBreaking,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Reset and pop back to feed.
      setContent(''); setHashtags(''); setIsBreaking(false); setSelectedType('post');
      router.replace('/(tabs)');
    } catch (err: any) {
      const apiErr = err as ApiError;
      const msg = (apiErr?.details as any)?.error ?? apiErr?.message ?? 'Failed to publish post';
      setError(msg);
      Alert.alert('Could not publish', msg);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, content, hashtags, selectedType, isBreaking, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Create" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Author preview */}
        <View style={styles.authorRow}>
          <Avatar url={user?.avatarUrl ?? undefined} size={40} goldRing={user?.isVerified || !!user?.isPro} />
          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>{user?.name ?? 'You'}</Text>
            <Text style={styles.authorHandle}>{user?.handle ?? '@you'}</Text>
          </View>
        </View>

        {/* Post type picker */}
        <Text style={styles.sectionLabel}>Post type</Text>
        <View style={styles.typeRow}>
          {POST_TYPES.map((t) => {
            const Icon = t.icon;
            const active = selectedType === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSelectedType(t.id);
                }}
                style={[styles.typeChip, active && styles.typeChipActive]}
              >
                <Icon size={14} color={active ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Content textarea */}
        <Text style={styles.sectionLabel}>Content</Text>
        <GlassCard style={styles.textareaCard}>
          <TextInput
            style={styles.textarea}
            value={content}
            onChangeText={(v) => {
              if (v.length <= MAX_CHARS) setContent(v);
              if (error) setError(null);
            }}
            placeholder="What's happening in sports?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.textareaFooter}>
            {isBreaking ? (
              <View style={styles.breakingBadge}>
                <AlertCircle size={11} color={colors.destructive} />
                <Text style={styles.breakingText}>BREAKING</Text>
              </View>
            ) : null}
            <Text style={[styles.charCount, remaining < 50 && styles.charCountLow]}>
              {remaining}
            </Text>
          </View>
        </GlassCard>

        {/* Hashtags */}
        <Text style={styles.sectionLabel}>Hashtags (optional)</Text>
        <View style={styles.inputWrap}>
          <Hash size={18} color={colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={hashtags}
            onChangeText={setHashtags}
            placeholder="football championsleague kenya"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Breaking toggle */}
        <Pressable
          style={styles.toggleRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setIsBreaking((v) => !v);
          }}
        >
          <View style={[styles.checkbox, isBreaking && styles.checkboxChecked]}>
            {isBreaking ? <Text style={styles.checkboxText}>✓</Text> : null}
          </View>
          <View style={styles.toggleMeta}>
            <Text style={styles.toggleLabel}>Mark as breaking news</Text>
            <Text style={styles.toggleHint}>
              Highlighted with a red badge in the feed.
            </Text>
          </View>
        </Pressable>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Send size={16} color={colors.primaryForeground} />
              <Text style={styles.submitText}>Publish</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          By publishing, you agree to Sportsphere's community guidelines.
          Posts are visible on the live global feed.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  authorMeta: { gap: 2 },
  authorName: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
  authorHandle: {
    fontFamily: FONT_BODY_REG, fontSize: 12, color: colors.mutedForeground,
  },
  sectionLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 11, fontWeight: '700',
    color: colors.mutedForeground, marginBottom: 8, marginLeft: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.input,
    borderWidth: 1, borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  typeChipText: {
    fontFamily: FONT_BODY, fontSize: 12, color: colors.mutedForeground,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: colors.primaryForeground, fontWeight: '700',
  },
  textareaCard: { padding: 4, marginBottom: 16 },
  textarea: {
    minHeight: 140, padding: 12,
    fontFamily: FONT_BODY, fontSize: 15, lineHeight: 22,
    color: colors.foreground, textAlignVertical: 'top',
  },
  textareaFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 8,
  },
  breakingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255, 69, 58, 0.10)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  breakingText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700',
    color: colors.destructive, letterSpacing: 0.5,
  },
  charCount: {
    fontFamily: FONT_BODY_REG, fontSize: 11, color: colors.mutedForeground,
  },
  charCountLow: { color: colors.destructive },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.input,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, height: 48,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, fontFamily: FONT_BODY, fontSize: 14,
    color: colors.foreground, padding: 0,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, marginBottom: 8,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  checkboxText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.primaryForeground,
  },
  toggleMeta: { flex: 1, gap: 2 },
  toggleLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
  toggleHint: {
    fontFamily: FONT_BODY_REG, fontSize: 12, color: colors.mutedForeground,
  },
  errorBanner: {
    marginTop: 8, padding: 12, borderRadius: 10,
    backgroundColor: 'rgba(255, 69, 58, 0.10)',
    borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.30)',
  },
  errorText: {
    fontFamily: FONT_BODY, fontSize: 13, color: colors.destructive,
  },
  submitButton: {
    marginTop: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    height: 52, borderRadius: 14,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 15, fontWeight: '700',
    color: colors.primaryForeground,
  },
  disclaimer: {
    fontFamily: FONT_BODY_REG, fontSize: 11, color: colors.mutedForeground,
    textAlign: 'center', marginTop: 12, paddingHorizontal: 16, lineHeight: 16,
  },
});

/**
 * Create Screen — matches web CreateTab exactly
 * -----------------------------------------------
 * Shows a grid of 6 creation types when no type selected:
 *   Post (blue), Photo (pink), Video (purple), Spotlight (gold), Poll (cyan), Prediction (green)
 * Each has icon, label, description in a glass card.
 * When type selected, shows composer with text area, media upload, hashtags, location, breaking news toggle.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Send, Hash, Image as ImageIcon, Vote, BarChart3, AlertCircle,
  FileText, Video, Sparkles, MapPin, X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { postsApi } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import type { ApiError } from '@sportsphere/api-client';

const GOLD = '#F5C518';
const BG = '#0A1628';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

const CREATE_TYPES = [
  { id: 'post',       label: 'Post',       icon: FileText,  color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.10)',   border: 'rgba(59, 130, 246, 0.30)',   description: 'Share a thought, news, or update.' },
  { id: 'photo',      label: 'Photo',      icon: ImageIcon, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.10)',   border: 'rgba(236, 72, 153, 0.30)',   description: 'Share a photo from a match or event.' },
  { id: 'video',      label: 'Video',      icon: Video,     color: '#A855F7', bg: 'rgba(168, 85, 247, 0.10)',   border: 'rgba(168, 85, 247, 0.30)',   description: 'Share a clip or highlight reel.' },
  { id: 'spotlight',  label: 'Spotlight',  icon: Sparkles,  color: GOLD,      bg: 'rgba(245, 197, 24, 0.10)',   border: 'rgba(245, 197, 24, 0.30)',   description: 'Shine a spotlight on a story.' },
  { id: 'poll',       label: 'Poll',       icon: Vote,      color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.10)',    border: 'rgba(6, 182, 212, 0.30)',    description: 'Ask the community a question.' },
  { id: 'prediction', label: 'Prediction', icon: BarChart3, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.10)',    border: 'rgba(34, 197, 94, 0.30)',    description: 'Predict the score of a match.' },
];

const MAX_CHARS = 500;

type PostType = 'post' | 'photo' | 'video' | 'spotlight' | 'poll' | 'prediction';

export default function CreateScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
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
        postType: selectedType === 'spotlight' ? 'spotlight' : selectedType === 'post' ? 'post' : selectedType,
        hashtags: tags,
        isBreaking,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setContent(''); setHashtags(''); setIsBreaking(false); setSelectedType(null);
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

  // Grid of 6 creation types
  if (!selectedType) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>Create</Text>
          <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={12}>
            <X color={FG} size={22} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.gridContent}>
          <Text style={styles.sectionTitle}>What do you want to create?</Text>
          <View style={styles.grid}>
            {CREATE_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedType(t.id as PostType);
                  }}
                >
                  <GlassCard style={[styles.typeCard, { borderColor: t.border }] as any}>
                    <View style={[styles.typeIconWrap, { backgroundColor: t.bg }]}>
                      <Icon size={24} color={t.color} />
                    </View>
                    <Text style={styles.typeLabel}>{t.label}</Text>
                    <Text style={styles.typeDescription}>{t.description}</Text>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  const currentType = CREATE_TYPES.find((t) => t.id === selectedType);
  const TypeIcon = currentType?.icon ?? FileText;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => setSelectedType(null)} hitSlop={12}>
          <X color={FG} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{currentType?.label ?? 'Create'}</Text>
        <Pressable
          style={[styles.publishButton, !canSubmit && styles.publishButtonDisabled]}
          disabled={!canSubmit || submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#0A1628" />
          ) : (
            <Send size={18} color="#0A1628" />
          )}
        </Pressable>
      </View>

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
          <View style={[styles.activeTypeBadge, { backgroundColor: currentType?.bg, borderColor: currentType?.border }]}>
            <TypeIcon size={12} color={currentType?.color} />
            <Text style={[styles.activeTypeText, { color: currentType?.color }]}>{currentType?.label}</Text>
          </View>
        </View>

        {/* Content textarea */}
        <GlassCard style={styles.textareaCard}>
          <TextInput
            style={styles.textarea}
            value={content}
            onChangeText={(v) => {
              if (v.length <= MAX_CHARS) setContent(v);
              if (error) setError(null);
            }}
            placeholder="What's happening in sports?"
            placeholderTextColor={MUTED}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.textareaFooter}>
            {isBreaking ? (
              <View style={styles.breakingBadge}>
                <AlertCircle size={11} color="#FF453A" />
                <Text style={styles.breakingText}>BREAKING</Text>
              </View>
            ) : null}
            <Text style={[styles.charCount, remaining < 50 && styles.charCountLow]}>
              {remaining}
            </Text>
          </View>
        </GlassCard>

        {/* Media upload button */}
        <Pressable style={styles.mediaUploadButton}>
          <ImageIcon size={20} color={MUTED} />
          <Text style={styles.mediaUploadText}>Add Photo or Video</Text>
        </Pressable>

        {/* Hashtags */}
        <View style={styles.inputWrap}>
          <Hash size={18} color={MUTED} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={hashtags}
            onChangeText={setHashtags}
            placeholder="Add hashtags..."
            placeholderTextColor={MUTED}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Location */}
        <Pressable style={styles.inputWrap}>
          <MapPin size={18} color={MUTED} style={styles.inputIcon} />
          <Text style={[styles.input, { color: MUTED }]}>Add location</Text>
        </Pressable>

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
            <Text style={styles.toggleHint}>Highlighted with a red badge in the feed.</Text>
          </View>
        </Pressable>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.disclaimer}>
          By publishing, you agree to SportSphere's community guidelines.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  wordmark: {
    fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: '700', color: FG, letterSpacing: -0.5,
  },
  headerTitle: {
    fontFamily: FONT_BODY_BOLD, fontSize: 16, fontWeight: '700', color: FG,
  },
  publishButton: {
    width: 36, height: 36, borderRadius: 999, backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  publishButtonDisabled: { opacity: 0.5 },

  // Grid of create types
  gridContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },
  sectionTitle: {
    fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700', color: FG, marginBottom: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: {
    width: '47%', padding: 16, gap: 10, alignItems: 'flex-start',
  },
  typeIconWrap: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  typeLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 15, fontWeight: '700', color: FG,
  },
  typeDescription: {
    fontFamily: FONT_BODY_REG, fontSize: 12, lineHeight: 16, color: MUTED,
  },

  // Composer
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  authorMeta: { flex: 1, gap: 2 },
  authorName: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: FG,
  },
  authorHandle: { fontFamily: FONT_BODY_REG, fontSize: 12, color: MUTED },
  activeTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4,
  },
  activeTypeText: { fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700' },
  textareaCard: { padding: 4, marginBottom: 12 },
  textarea: {
    minHeight: 140, padding: 12,
    fontFamily: FONT_BODY, fontSize: 15, lineHeight: 22, color: FG, textAlignVertical: 'top',
  },
  textareaFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 8,
  },
  breakingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255, 69, 58, 0.10)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  breakingText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700', color: '#FF453A', letterSpacing: 0.5,
  },
  charCount: { fontFamily: FONT_BODY_REG, fontSize: 11, color: MUTED },
  charCountLow: { color: '#FF453A' },
  mediaUploadButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, marginBottom: 8,
  },
  mediaUploadText: { fontFamily: FONT_BODY_REG, fontSize: 14, color: MUTED },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 14, height: 48, marginBottom: 8,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: FONT_BODY, fontSize: 14, color: FG, padding: 0 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, marginBottom: 8,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: GOLD, borderColor: GOLD },
  checkboxText: { fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: '#0A1628' },
  toggleMeta: { flex: 1, gap: 2 },
  toggleLabel: { fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: FG },
  toggleHint: { fontFamily: FONT_BODY_REG, fontSize: 12, color: MUTED },
  errorBanner: {
    marginTop: 8, padding: 12, borderRadius: 10,
    backgroundColor: 'rgba(255, 69, 58, 0.10)', borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.30)',
  },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, color: '#FF453A' },
  disclaimer: {
    fontFamily: FONT_BODY_REG, fontSize: 11, color: MUTED,
    textAlign: 'center', marginTop: 12, paddingHorizontal: 16, lineHeight: 16,
  },
});

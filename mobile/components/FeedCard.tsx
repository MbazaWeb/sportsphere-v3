/**
 * FeedCard — sports feed post card
 * --------------------------------
 * Mirrors the web FeedCard component:
 *   - author avatar + name + handle + verified badge
 *   - optional text content
 *   - optional media (image)
 *   - poll + prediction payloads
 *   - action row: like, comment, share, bookmark
 *
 * Consumes the live `Post` type from @sportsphere/types/feed (no mock).
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import {
  Heart, MessageCircle, Share2, Bookmark, BadgeCheck,
  BarChart3, Vote, Image as ImageIcon,
} from 'lucide-react-native';

import GlassCard from './GlassCard';
import Avatar from './Avatar';
import { colors } from '@sportsphere/design-system/tokens';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_REG, FONT_BODY_BOLD } from '../lib/fonts';
import type { Post } from '@sportsphere/types/feed';

interface FeedCardProps {
  post: Post;
  onLike?: (post: Post) => void;
  onComment?: (post: Post) => void;
  onShare?: (post: Post) => void;
  onBookmark?: (post: Post) => void;
  onAuthorPress?: (post: Post) => void;
}

export default function FeedCard({
  post, onLike, onComment, onShare, onBookmark, onAuthorPress,
}: FeedCardProps) {
  const author = post.author;
  const firstMedia = post.media?.[0];

  return (
    <GlassCard style={styles.card}>
      {/* ── Author row ──────────────────────────────────── */}
      <Pressable style={styles.authorRow} onPress={() => onAuthorPress?.(post)}>
        <Avatar url={author.avatarUrl ?? undefined} size={44} goldRing={author.isVerified || author.isPro} />
        <View style={styles.authorMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{author.displayName}</Text>
            {author.isVerified ? <BadgeCheck size={14} color={colors.primary} /> : null}
            {author.isPro ? (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.handle} numberOfLines={1}>@{author.handle} · {formatRelative(post.createdAt)}</Text>
        </View>
        <TypePill type={post.type} />
      </Pressable>

      {/* ── Content ────────────────────────────────────── */}
      {post.content ? (
        <Text style={styles.content} selectable>{post.content}</Text>
      ) : null}

      {/* ── Media ──────────────────────────────────────── */}
      {firstMedia ? (
        <View style={styles.mediaWrap}>
          <Image
            source={firstMedia.url}
            style={styles.media}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        </View>
      ) : null}

      {/* ── Prediction payload ─────────────────────────── */}
      {post.prediction ? (
        <View style={styles.prediction}>
          <View style={styles.predictionHeader}>
            <BarChart3 size={14} color={colors.accent} />
            <Text style={styles.predictionLabel}>PREDICTION</Text>
          </View>
          <Text style={styles.predictionMatch} numberOfLines={1}>{post.prediction.matchLabel}</Text>
          <Text style={styles.predictionScore}>
            {post.prediction.predictedScoreHome} - {post.prediction.predictedScoreAway}
            {'  ·  '}
            <Text style={styles.predictionConfidence}>
              {Math.round(post.prediction.confidence * 100)}% confidence
            </Text>
          </Text>
        </View>
      ) : null}

      {/* ── Poll payload ───────────────────────────────── */}
      {post.poll ? (
        <View style={styles.poll}>
          <View style={styles.predictionHeader}>
            <Vote size={14} color={colors.primary} />
            <Text style={styles.predictionLabel}>POLL</Text>
          </View>
          <Text style={styles.pollQuestion}>{post.poll.question}</Text>
          {post.poll.options.map((opt, idx) => {
            const votes = post.poll?.totalVotes || 0;
            const pct = votes > 0 ? Math.round((opt.voteCount / votes) * 100) : 0;
            const voted = post.poll?.votedOptionId === opt.id;
            return (
              <View key={opt.id} style={[styles.pollOption, voted && styles.pollOptionVoted]}>
                <Text style={styles.pollOptionLabel}>{opt.label}</Text>
                <Text style={styles.pollOptionPct}>{pct}%</Text>
              </View>
            );
          })}
          <Text style={styles.pollTotalVotes}>{post.poll.totalVotes} votes</Text>
        </View>
      ) : null}

      {/* ── Actions ────────────────────────────────────── */}
      <View style={styles.actions}>
        <ActionPill
          icon={
            <Heart
              size={18}
              color={post.likedByMe ? colors.destructive : colors.mutedForeground}
              fill={post.likedByMe ? colors.destructive : 'none'}
            />
          }
          label={formatCount(post.likeCount)}
          onPress={() => onLike?.(post)}
        />
        <ActionPill
          icon={<MessageCircle size={18} color={colors.mutedForeground} />}
          label={formatCount(post.commentCount)}
          onPress={() => onComment?.(post)}
        />
        <ActionPill
          icon={<Share2 size={18} color={colors.mutedForeground} />}
          label={formatCount(post.shareCount)}
          onPress={() => onShare?.(post)}
        />
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => onBookmark?.(post)} hitSlop={12} accessibilityLabel="Bookmark">
          <Bookmark
            size={18}
            color={post.bookmarkedByMe ? colors.primary : colors.mutedForeground}
            fill={post.bookmarkedByMe ? colors.primary : 'none'}
          />
        </Pressable>
      </View>
    </GlassCard>
  );
}

function ActionPill({
  icon, label, onPress,
}: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.actionPill}>
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function TypePill({ type }: { type: Post['type'] }) {
  if (type === 'POST') return null;
  const labels: Record<string, string> = {
    PREDICTION: 'PREDICTION',
    POLL: 'POLL',
    HIGHLIGHT: 'HIGHLIGHT',
  };
  return (
    <View style={styles.typePill}>
      <Text style={styles.typePillText}>{labels[type] ?? type}</Text>
    </View>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const sec = Math.max(1, Math.floor((now - then) / 1000));
  if (sec < 60)    return `${sec}s`;
  if (sec < 3600)  return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  authorMeta: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: {
    fontFamily: FONT_BODY_BOLD, fontWeight: '700', fontSize: 15,
    color: colors.foreground, maxWidth: 200,
  },
  handle: {
    fontFamily: FONT_BODY_REG, fontSize: 12, color: colors.mutedForeground,
  },
  proBadge: {
    backgroundColor: colors.accent, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  proBadgeText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: colors.accentForeground, letterSpacing: 0.5,
  },
  typePill: {
    backgroundColor: 'rgba(245, 197, 24, 0.10)',
    borderWidth: 1, borderColor: 'rgba(245, 197, 24, 0.30)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  typePillText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: colors.primary, letterSpacing: 0.5,
  },
  content: {
    fontFamily: FONT_BODY, fontSize: 15, lineHeight: 22,
    color: colors.foreground,
  },
  mediaWrap: {
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  media: { width: '100%', height: 220 },
  prediction: {
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 107, 53, 0.25)',
    borderRadius: 12, padding: 12, gap: 4,
  },
  predictionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  predictionLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700',
    color: colors.accent, letterSpacing: 0.5,
  },
  predictionMatch: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
  predictionScore: {
    fontFamily: FONT_BODY, fontSize: 13, color: colors.mutedForeground,
  },
  predictionConfidence: {
    fontFamily: FONT_BODY_BOLD, fontWeight: '700', color: colors.accent,
  },
  poll: {
    backgroundColor: 'rgba(245, 197, 24, 0.08)',
    borderWidth: 1, borderColor: 'rgba(245, 197, 24, 0.25)',
    borderRadius: 12, padding: 12, gap: 8,
  },
  pollQuestion: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground,
  },
  pollOption: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'transparent',
  },
  pollOptionVoted: { borderColor: colors.primary },
  pollOptionLabel: {
    fontFamily: FONT_BODY, fontSize: 13, color: colors.foreground,
  },
  pollOptionPct: {
    fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '700',
    color: colors.primary,
  },
  pollTotalVotes: {
    fontFamily: FONT_BODY_REG, fontSize: 11, color: colors.mutedForeground,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionLabel: {
    fontFamily: FONT_BODY, fontSize: 13, color: colors.mutedForeground,
    fontWeight: '500',
  },
});

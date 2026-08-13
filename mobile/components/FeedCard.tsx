import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
/**
 * FeedCard — matches web FeedCard exactly
 * ----------------------------------------
 * - Author row: avatar, name, verified badge, PRO badge, handle, relative time, post type pill
 * - Text content (selectable)
 * - Media image (expo-image, 220px height, cover fit)
 * - For predictions: match label, predicted score, confidence %
 * - For polls: question, options with vote %, voted highlight
 * - Action row: like (heart, filled when liked), comment, share, bookmark (filled when bookmarked)
 */

import {
  Heart, MessageCircle, Share2, Bookmark, BadgeCheck,
  BarChart3, Vote, Crown,
} from 'lucide-react-native';

import GlassCard from './GlassCard';
import Avatar from './Avatar';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_REG, FONT_BODY_BOLD } from '../lib/fonts';
import type { Post } from '@sportsphere/types/feed';

const GOLD = '#F5C518';
const BG_SECONDARY = '#0F1D3A';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

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
            {author.isVerified ? <BadgeCheck size={14} color={GOLD} /> : null}
            {author.isPro ? (
              <View style={styles.proBadge}>
                <Crown size={8} color="#0A1628" />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.handle} numberOfLines={1}>
            @{author.handle} · {formatRelative(post.createdAt)}
          </Text>
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
            source={{ uri: firstMedia.url }}
            style={styles.media}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* ── Prediction payload ─────────────────────────── */}
      {post.prediction ? (
        <View style={styles.prediction}>
          <View style={styles.predictionHeader}>
            <BarChart3 size={14} color="#FF6B35" />
            <Text style={styles.predictionLabel}>PREDICTION</Text>
          </View>
          <Text style={styles.predictionMatch} numberOfLines={1}>{post.prediction.matchLabel}</Text>
          <View style={styles.predictionScoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreNumber}>{post.prediction.predictedScoreHome}</Text>
            </View>
            <Text style={styles.scoreDash}>-</Text>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreNumber}>{post.prediction.predictedScoreAway}</Text>
            </View>
            <View style={styles.confidenceBox}>
              <Text style={styles.confidenceValue}>{Math.round(post.prediction.confidence * 100)}%</Text>
              <Text style={styles.confidenceLabel}>confidence</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* ── Poll payload ───────────────────────────────── */}
      {post.poll ? (
        <View style={styles.poll}>
          <View style={styles.pollHeader}>
            <Vote size={14} color={GOLD} />
            <Text style={styles.pollLabel}>POLL</Text>
          </View>
          <Text style={styles.pollQuestion}>{post.poll.question}</Text>
          {post.poll.options.map((opt) => {
            const votes = post.poll?.totalVotes || 0;
            const pct = votes > 0 ? Math.round((opt.voteCount / votes) * 100) : 0;
            const voted = post.poll?.votedOptionId === opt.id;
            return (
              <View key={opt.id} style={[styles.pollOption, voted && styles.pollOptionVoted]}>
                {voted && <View style={[styles.pollOptionBar, { width: `${pct}%` }]} />}
                <View style={styles.pollOptionInner}>
                  <Text style={[styles.pollOptionLabel, voted && styles.pollOptionLabelVoted]}>{opt.label}</Text>
                  <Text style={styles.pollOptionPct}>{pct}%</Text>
                </View>
              </View>
            );
          })}
          <Text style={styles.pollTotalVotes}>{post.poll.totalVotes} votes</Text>
        </View>
      ) : null}

      {/* ── Actions ────────────────────────────────────── */}
      <View style={styles.actions}>
        <ActionPill
          icon={(
            <Heart
              size={18}
              color={post.likedByMe ? '#FF453A' : MUTED}
              fill={post.likedByMe ? '#FF453A' : 'none'}
            />
          )}
          label={formatCount(post.likeCount)}
          onPress={() => onLike?.(post)}
        />
        <ActionPill
          icon={<MessageCircle size={18} color={MUTED} />}
          label={formatCount(post.commentCount)}
          onPress={() => onComment?.(post)}
        />
        <ActionPill
          icon={<Share2 size={18} color={MUTED} />}
          label={formatCount(post.shareCount)}
          onPress={() => onShare?.(post)}
        />
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => onBookmark?.(post)} hitSlop={12} accessibilityLabel="Bookmark">
          <Bookmark
            size={18}
            color={post.bookmarkedByMe ? GOLD : MUTED}
            fill={post.bookmarkedByMe ? GOLD : 'none'}
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
    SPOTLIGHT: 'SPOTLIGHT',
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
  // Author row
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  authorMeta: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: {
    fontFamily: FONT_BODY_BOLD, fontWeight: '700', fontSize: 15,
    color: FG, maxWidth: 200,
  },
  handle: { fontFamily: FONT_BODY_REG, fontSize: 12, color: MUTED },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FF6B35', borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  proBadgeText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: '#0A1628', letterSpacing: 0.5,
  },
  typePill: {
    backgroundColor: 'rgba(245, 197, 24, 0.10)',
    borderWidth: 1, borderColor: 'rgba(245, 197, 24, 0.30)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  typePillText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 9, fontWeight: '700',
    color: GOLD, letterSpacing: 0.5,
  },
  // Content
  content: { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 22, color: FG },
  // Media
  mediaWrap: { borderRadius: 12, overflow: 'hidden', backgroundColor: BG_SECONDARY },
  media: { width: '100%', height: 220 },
  // Prediction
  prediction: {
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 107, 53, 0.25)',
    borderRadius: 12, padding: 12, gap: 8,
  },
  predictionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  predictionLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700',
    color: '#FF6B35', letterSpacing: 0.5,
  },
  predictionMatch: { fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: FG },
  predictionScoreRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4,
  },
  scoreBox: { flex: 1, alignItems: 'center', gap: 2 },
  scoreNumber: { fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: '700', color: FG },
  scoreDash: { fontFamily: FONT_BODY_REG, fontSize: 18, color: MUTED },
  confidenceBox: {
    alignItems: 'center', gap: 2, paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.15)', borderRadius: 8,
  },
  confidenceValue: { fontFamily: FONT_BODY_BOLD, fontSize: 16, fontWeight: '700', color: '#FF6B35' },
  confidenceLabel: { fontFamily: FONT_BODY_REG, fontSize: 9, color: MUTED },
  // Poll
  poll: {
    backgroundColor: 'rgba(245, 197, 24, 0.08)',
    borderWidth: 1, borderColor: 'rgba(245, 197, 24, 0.25)',
    borderRadius: 12, padding: 12, gap: 8,
  },
  pollHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pollLabel: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700',
    color: GOLD, letterSpacing: 0.5,
  },
  pollQuestion: { fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700', color: FG },
  pollOption: {
    flexDirection: 'row', borderRadius: 8, overflow: 'hidden',
    backgroundColor: SURFACE, borderWidth: 1, borderColor: 'transparent',
    height: 40,
  },
  pollOptionVoted: { borderColor: GOLD },
  pollOptionBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(245, 197, 24, 0.15)',
  },
  pollOptionInner: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  pollOptionLabel: { fontFamily: FONT_BODY, fontSize: 13, color: FG },
  pollOptionLabelVoted: { fontFamily: FONT_BODY_BOLD, fontWeight: '700' as const, color: FG },
  pollOptionPct: { fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '700', color: GOLD },
  pollTotalVotes: { fontFamily: FONT_BODY_REG, fontSize: 11, color: MUTED },
  // Actions
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionLabel: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, fontWeight: '500' as const },
});

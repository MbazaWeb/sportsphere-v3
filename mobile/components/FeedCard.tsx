/**
 * FeedCard — sports feed post card
 * --------------------------------
 * Mirrors the web FeedCard component:
 *   - author avatar + name + handle + verified badge
 *   - optional text content
 *   - optional media (image)
 *   - action row: like, comment, share, bookmark
 *
 * Uses mock data for now — real feed wire-up happens in Phase C.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Heart, MessageCircle, Share2, Bookmark, BadgeCheck } from 'lucide-react-native';

import GlassCard from './GlassCard';
import Avatar from './Avatar';
import { colors, typography } from '@sportsphere/design-system/tokens';

export interface FeedCardData {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  verified?: boolean;
  content: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  liked?: boolean;
  bookmarked?: boolean;
}

interface FeedCardProps {
  data: FeedCardData;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
}

export default function FeedCard({ data, onLike, onComment, onShare, onBookmark }: FeedCardProps) {
  return (
    <GlassCard style={styles.card}>
      {/* ── Author row ──────────────────────────────────── */}
      <View style={styles.authorRow}>
        <Avatar url={data.authorAvatar} size={44} goldRing={data.verified} />
        <View style={styles.authorMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{data.authorName}</Text>
            {data.verified && <BadgeCheck size={14} color={colors.primary} />}
          </View>
          <Text style={styles.handle}>@{data.authorHandle}</Text>
        </View>
      </View>

      {/* ── Content ────────────────────────────────────── */}
      <Text style={styles.content}>{data.content}</Text>

      {/* ── Actions ────────────────────────────────────── */}
      <View style={styles.actions}>
        <ActionPill
          icon={<Heart size={18} color={data.liked ? colors.destructive : colors.mutedForeground} fill={data.liked ? colors.destructive : 'none'} />}
          label={formatCount(data.likeCount)}
          onPress={onLike}
        />
        <ActionPill
          icon={<MessageCircle size={18} color={colors.mutedForeground} />}
          label={formatCount(data.commentCount)}
          onPress={onComment}
        />
        <ActionPill
          icon={<Share2 size={18} color={colors.mutedForeground} />}
          label={formatCount(data.shareCount)}
          onPress={onShare}
        />
        <View style={{ flex: 1 }} />
        <Pressable onPress={onBookmark} hitSlop={12} accessibilityLabel="Bookmark">
          <Bookmark
            size={18}
            color={data.bookmarked ? colors.primary : colors.mutedForeground}
            fill={data.bookmarked ? colors.primary : 'none'}
          />
        </Pressable>
      </View>
    </GlassCard>
  );
}

function ActionPill({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.actionPill}>
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    fontWeight: '700',
    fontSize: 15,
    color: colors.foreground,
  },
  handle: {
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    fontSize: 13,
    color: colors.mutedForeground,
  },
  content: {
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    fontSize: 15,
    lineHeight: 22,
    color: colors.foreground,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
});

import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, Send, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import FeedCard from '../../components/FeedCard';
import Avatar from '../../components/Avatar';
import GlassCard from '../../components/GlassCard';
import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_REG } from '../../lib/fonts';
import { feedApi, postsApi, commentsApi } from '../../lib/api';
import { sharePost } from '../../lib/sharing';
import type { Post } from '@sportsphere/types/feed';
import type { Comment } from '@sportsphere/api-client';

const GOLD = '#F5C518';
const BG = '#0A1628';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const SURFACE = 'rgba(255, 255, 255, 0.05)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadingComments(true);
    setError(null);
    try {
      const [postData, commentsData] = await Promise.all([
        feedApi.getById(id),
        commentsApi.list(id)
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load post');
    } finally {
      setLoading(false);
      setLoadingComments(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLike = useCallback(async (p: Post) => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPost({
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
    });
    try {
      await postsApi.toggleLike(post.id);
    } catch {
      setPost(post);
    }
  }, [post]);

  const handleShare = useCallback(() => {
    if (post) {
      sharePost(post.id, post.content || 'Check out this post on SportSphere!');
    }
  }, [post]);

  const handlePostComment = async () => {
    if (!id || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await commentsApi.create({ postId: id, content: newComment });
      setComments([comment, ...comments]);
      setNewComment('');
      if (post) setPost({ ...post, commentCount: post.commentCount + 1 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Optimistic update
    setComments(prev => prev.map(c => c.id === commentId ? {
      ...c,
      viewerLiked: !c.viewerLiked,
      likeCount: c.likeCount + (c.viewerLiked ? -1 : 1)
    } : c));

    try {
      await commentsApi.toggleLike(commentId);
    } catch {
      // rollback
      loadData();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Custom Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft color={FG} size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <View style={styles.center}><ActivityIndicator color={GOLD} size="large" /></View>
          ) : error ? (
            <GlassCard style={styles.errorCard}>
              <Text style={styles.errorTitle}>Oops!</Text>
              <Text style={styles.errorBody}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={loadData}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </GlassCard>
          ) : post ? (
            <>
              <FeedCard
                post={post}
                onLike={handleLike}
                onShare={handleShare}
                onAuthorPress={() => router.push(`/player/${post.author.id}`)}
              />

              <View style={styles.commentsSection}>
                <Text style={styles.sectionTitle}>Comments ({post.commentCount})</Text>

                {loadingComments ? (
                  <ActivityIndicator color={GOLD} style={{ marginTop: 20 }} />
                ) : comments.length === 0 ? (
                  <View style={styles.emptyComments}>
                    <Text style={styles.emptyText}>No comments yet. Be the first to reply!</Text>
                  </View>
                ) : (
                  comments.map(comment => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      onLike={() => handleLikeComment(comment.id)}
                      onAuthorPress={() => router.push(`/player/${comment.user.id}`)}
                    />
                  ))
                )}
              </View>
            </>
          ) : (
            <Text style={styles.errorBody}>Post not found</Text>
          )}
        </ScrollView>

        {/* Comment Input */}
        {post && (
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor={MUTED}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <Pressable
              style={[styles.sendButton, !newComment.trim() && { opacity: 0.5 }]}
              onPress={handlePostComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator size="small" color="#0A1628" /> : <Send size={20} color="#0A1628" />}
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function CommentRow({ comment, onLike, onAuthorPress }: { comment: Comment; onLike: () => void; onAuthorPress: () => void }) {
  return (
    <View style={styles.commentRow}>
      <Pressable onPress={onAuthorPress}>
        <Avatar url={comment.user.avatarUrl ?? undefined} size={32} />
      </Pressable>
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <Pressable onPress={onAuthorPress}>
            <Text style={styles.commentAuthor}>{comment.user.name}</Text>
          </Pressable>
          <Text style={styles.commentText}>{comment.content}</Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.commentTime}>{formatRelative(comment.createdAt)}</Text>
          <Pressable onPress={onLike} style={styles.commentLikeAction}>
            <Heart size={12} color={comment.viewerLiked ? '#FF453A' : MUTED} fill={comment.viewerLiked ? '#FF453A' : 'none'} />
            <Text style={[styles.commentLikeCount, comment.viewerLiked && { color: '#FF453A' }]}>
              {comment.likeCount > 0 ? comment.likeCount : 'Like'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
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
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700', color: FG },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { marginTop: 100, alignItems: 'center' },
  errorCard: { padding: 24, gap: 8, alignItems: 'center' },
  errorTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: '700', color: FG },
  errorBody: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center' },
  retryButton: { marginTop: 12, backgroundColor: GOLD, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { fontFamily: FONT_BODY_BOLD, fontSize: 14, color: '#0A1628' },
  commentsSection: { marginTop: 24, gap: 16 },
  sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '700', color: FG, marginBottom: 4 },
  emptyComments: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center' },

  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  commentContent: { flex: 1, gap: 4 },
  commentBubble: { backgroundColor: SURFACE, padding: 10, borderRadius: 14, borderTopLeftRadius: 2 },
  commentAuthor: { fontFamily: FONT_BODY_BOLD, fontSize: 13, color: GOLD, marginBottom: 2 },
  commentText: { fontFamily: FONT_BODY_REG, fontSize: 14, color: FG, lineHeight: 18 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingLeft: 4 },
  commentTime: { fontFamily: FONT_BODY_REG, fontSize: 11, color: MUTED },
  commentLikeAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentLikeCount: { fontFamily: FONT_BODY_BOLD, fontSize: 11, color: MUTED },

  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#0F1D3A', borderTopWidth: 1, borderTopColor: BORDER,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  input: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, paddingTop: 8,
    color: FG, fontFamily: FONT_BODY, fontSize: 14, maxHeight: 100,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
});

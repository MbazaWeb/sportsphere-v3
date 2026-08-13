'use client';
import { apiFetch } from '@/lib/api';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X, Send, MessageCircle, Heart, CornerDownRight, AtSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatTime } from '@/lib/format';
import { apiUserToViewing } from '@/types';

// ─── Types ────────────────────────────────────────────────────
interface ApiCommentUser {
  id: string; name: string; handle: string;
  avatarUrl?: string | null; avatarInitials: string;
  isVerified: boolean; role: string;
}

interface ApiComment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  mentionedUserIds: string[];
  mentionedUsers: Array<{ id: string; name: string; handle: string; avatarInitials: string; isVerified: boolean }>;
  viewerLiked: boolean;
  createdAt: string;
  user: ApiCommentUser;
  replies?: ApiComment[];
}

interface CommentSheetProps {
  itemId: string;
  onClose: () => void;
}

// ─── CommentSheet ─────────────────────────────────────────────
export function CommentSheet({ itemId, onClose }: CommentSheetProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userProfile = useAuthStore((s) => s.userProfile);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer state — supports both top-level comments and replies.
  // When `replyTarget` is null, the composer posts a top-level comment.
  // When set, the composer posts a reply and shows a dismissable banner.
  const [text, setText] = useState('');
  const [replyTarget, setReplyTarget] = useState<ApiComment | null>(null);
  const [mentionQuery, setMentionQuery] = useState<{ startIndex: number; query: string } | null>(null);
  const [mentionResults, setMentionResults] = useState<Array<{ id: string; name: string; handle: string; avatarInitials: string }>>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionAbortRef = useRef<AbortController | null>(null);

  // ─── Load comments ──────────────────────────────────────────
  const loadComments = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/comments?postId=${itemId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch { /* noop */ }
    setLoading(false);
  }, [itemId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // ─── Mention search ─────────────────────────────────────────
  // When the user types `@` followed by at least one character, we
  // search `/api/users?q=…` and show a dropdown above the textarea.
  useEffect(() => {
    if (!mentionQuery) {
      setMentionResults([]);
      setMentionIndex(0);
      return;
    }
    if (mentionQuery.query.length < 1) {
      setMentionResults([]);
      return;
    }

    // Debounce
    mentionAbortRef.current?.abort();
    const ctrl = new AbortController();
    mentionAbortRef.current = ctrl;

    const t = setTimeout(async () => {
      try {
        // The user typed `@xyz`. Search using `xyz` (the API searches name/handle/bio).
        // Handles are stored WITH the leading '@', so prefix the query with '@'
        // to also match handle-prefix searches.
        const q = mentionQuery.query;
        const res = await apiFetch(`/api/users?q=${encodeURIComponent(q)}&limit=8`);
        if (res.ok && !ctrl.signal.aborted) {
          const data = await res.json();
          setMentionResults(Array.isArray(data) ? data : []);
          setMentionIndex(0);
        }
      } catch { /* noop */ }
    }, 180);

    return () => {
      clearTimeout(t);
    };
  }, [mentionQuery]);

  // ─── Detect @mention while typing ───────────────────────────
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    if (!isAuthenticated) return;

    const caret = e.target.selectionStart;
    // Walk back from caret to find an unbroken `@xxx` token.
    const before = value.slice(0, caret);
    const match = before.match(/@([a-zA-Z0-9_]+)$/);
    if (match) {
      setMentionQuery({ startIndex: caret - match[0].length, query: match[1] });
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (user: { id: string; name: string; handle: string; avatarInitials: string }) => {
    if (!mentionQuery) return;
    // Replace the `@query` token (from startIndex to caret) with `@handle `.
    const before = text.slice(0, mentionQuery.startIndex);
    const tokenLen = 1 + mentionQuery.query.length; // '@' + query
    const after = text.slice(before.length + tokenLen);
    const insertion = `@${user.handle} `;
    const newText = before + insertion + after;
    setText(newText);
    setMentionQuery(null);
    // Refocus and move caret to end of inserted mention
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = before.length + insertion.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  // ─── Submit comment or reply ────────────────────────────────
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      onClose();
      setLoginModalOpen(true);
      return;
    }
    if (!text.trim() || submitting) return;

    const payload: Record<string, unknown> = {
      postId: itemId,
      content: text.trim(),
    };
    if (replyTarget) {
      payload.parentId = replyTarget.id;
    }
    // Extract mentioned user IDs from the text by matching @handle tokens.
    // We don't validate them — unknown handles are simply ignored by the API.
    const tokens = text.match(/@([a-zA-Z0-9_]+)/g) ?? [];
    if (tokens.length) {
      payload.mentionedUserIds = tokens; // backend will resolve and sanitize
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newComment = await res.json();
        if (replyTarget) {
          // Append to the parent's replies
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTarget.id
                ? { ...c, replies: [...(c.replies ?? []), newComment] }
                : c,
            ),
          );
        } else {
          // Top-level comment — prepend
          setComments((prev) => [newComment, ...prev]);
        }
        setText('');
        setReplyTarget(null);
        setMentionQuery(null);
      }
    } catch { /* noop */ }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Mention navigation
    if (mentionQuery && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionResults.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionResults.length) % mentionResults.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionResults[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ─── Like a comment or reply ────────────────────────────────
  const toggleLike = async (commentId: string, isReply: boolean, parentId?: string) => {
    if (!isAuthenticated) {
      onClose();
      setLoginModalOpen(true);
      return;
    }

    // Optimistic update
    const updateOne = (c: ApiComment): ApiComment => {
      if (c.id === commentId) {
        return {
          ...c,
          viewerLiked: !c.viewerLiked,
          likeCount: c.likeCount + (c.viewerLiked ? -1 : 1),
        };
      }
      if (c.replies) {
        return { ...c, replies: c.replies.map(updateOne) };
      }
      return c;
    };

    setComments((prev) => prev.map(updateOne));

    try {
      const res = await apiFetch('/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      if (!res.ok) {
        // Revert on failure
        setComments((prev) => prev.map(updateOne));
      }
    } catch {
      setComments((prev) => prev.map(updateOne));
    }
    void isReply; void parentId;
  };

  // ─── Open user profile from a comment ───────────────────────
  const openUser = async (u: ApiCommentUser) => {
    try {
      const res = await apiFetch(`/api/users?handle=${encodeURIComponent(u.handle)}`);
      if (res.ok) {
        const data = await res.json();
        setViewingUser(apiUserToViewing(data, false));
        onClose();
      }
    } catch { /* noop */ }
  };

  // ─── Render a single comment (top-level or reply) ───────────
  const renderComment = (c: ApiComment, isReply = false) => {
    // Render content with @handle tokens highlighted as clickable chips.
    // Clicking a mention searches for that handle and opens the user's profile.
    const onMentionClick = (handle: string) => {
      // The API stores handles WITH the leading '@', so normalize.
      const normalized = handle.startsWith('@') ? handle : `@${handle}`;
      apiFetch(`/api/users?handle=${encodeURIComponent(normalized)}`)
        .then((r) => r.ok ? r.json() : null)
        .then((u) => {
          if (!u) return;
          setViewingUser(apiUserToViewing(u, false));
          onClose();
        })
        .catch(() => { /* noop */ });
    };
    const renderedContent = renderContentWithMentions(c.content, c.mentionedUsers, onMentionClick);

    return (
      <div key={c.id} className={cn('flex gap-3', isReply && 'ml-10')}>
        <button
          onClick={() => openUser(c.user)}
          className={cn(
            'flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold',
            isReply ? 'h-7 w-7' : 'h-9 w-9',
            c.user.isVerified ? 'bg-gold text-black' : 'bg-surface text-gold',
          )}
        >
          {c.user.avatarUrl ? (
            <img src={c.user.avatarUrl} alt={c.user.name} className="h-full w-full object-cover" />
          ) : (
            c.user.avatarInitials
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl bg-surface px-3 py-2">
            <button
              onClick={() => openUser(c.user)}
              className="mb-0.5 text-xs font-semibold text-white hover:underline"
            >
              {c.user.name}
            </button>
            <p className="text-sm text-foreground/90 break-words whitespace-pre-wrap">{renderedContent}</p>
          </div>
          <div className="mt-1 flex items-center gap-4 px-1">
            <span className="text-[10px] text-muted-foreground">{formatTime(c.createdAt)}</span>
            <button
              onClick={() => toggleLike(c.id, isReply)}
              className={cn(
                'flex items-center gap-1 text-[10px] font-semibold transition-colors',
                c.viewerLiked ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400',
              )}
            >
              <Heart className={cn('h-3 w-3', c.viewerLiked && 'fill-current')} />
              {c.likeCount > 0 ? c.likeCount : 'Like'}
            </button>
            {!isReply && (
              <button
                onClick={() => {
                  setReplyTarget(c);
                  setText('');
                  requestAnimationFrame(() => textareaRef.current?.focus());
                }}
                className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-white transition-colors"
              >
                <CornerDownRight className="h-3 w-3" />
                Reply
              </button>
            )}
          </div>

          {/* Replies */}
          {c.replies && c.replies.length > 0 && (
            <div className="mt-3 flex flex-col gap-3">
              {c.replies.map((r) => renderComment(r, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const replyTargetName = replyTarget?.user.name;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[80vh] w-full max-w-lg flex-col rounded-t-3xl bg-surface-elevated border-t border-surface-border overflow-hidden"
      >
        {/* Header */}
        <div className="relative flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-surface-border">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-surface-border" />
          <h3 className="text-sm font-bold text-white">
            Comments{comments.length > 0 && ` · ${comments.length}`}
          </h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface/50 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No comments yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Be the first to share your thoughts.</p>
            </div>
          ) : (
            comments.map((c) => renderComment(c))
          )}
        </div>

        {/* Reply banner */}
        {replyTarget && (
          <div className="flex-shrink-0 flex items-center justify-between bg-surface/60 px-4 py-2 border-t border-surface-border">
            <div className="flex items-center gap-2 min-w-0">
              <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                Replying to <span className="font-semibold text-white">{replyTargetName}</span>
              </p>
            </div>
            <button
              onClick={() => {
                setReplyTarget(null);
                setText('');
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-surface text-muted-foreground hover:text-white"
              aria-label="Cancel reply"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Mention autocomplete dropdown */}
        {mentionQuery && mentionResults.length > 0 && (
          <div className="flex-shrink-0 max-h-44 overflow-y-auto border-t border-surface-border bg-surface-elevated">
            {mentionResults.map((u, i) => (
              <button
                key={u.id}
                onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-left transition-colors',
                  i === mentionIndex ? 'bg-gold/10' : 'hover:bg-surface',
                )}
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-[10px] font-bold text-gold">
                  {u.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">@{u.handle}</p>
                </div>
                <AtSign className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="flex-shrink-0 border-t border-surface-border p-3 flex items-end gap-2 bg-surface-elevated">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gold text-xs font-bold text-black flex-shrink-0">
            {userProfile?.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="You" className="h-full w-full object-cover" />
            ) : (
              userProfile?.avatar?.slice(0, 2).toUpperCase() ?? 'ME'
            )}
          </div>
          <div className="relative flex-1 flex items-end gap-2 rounded-2xl bg-surface border border-surface-border px-3 py-2 focus-within:ring-1 focus-within:ring-gold">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={false}
              readOnly={false}
              placeholder={
                !isAuthenticated ? 'Sign in to comment...' :
                replyTarget ? `Reply to ${replyTargetName}...` :
                'Add a comment... (use @ to mention)'
              }
              className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-muted-foreground focus:outline-none max-h-24 min-h-[24px] pointer-events-auto"
              style={{ minHeight: '24px', maxHeight: '80px', pointerEvents: 'auto' }}
              autoComplete="off"
              enterKeyHint="send"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition-colors flex-shrink-0',
              text.trim() && !submitting ? 'bg-gold' : 'bg-surface border border-surface-border',
            )}
            aria-label="Send"
          >
            {submitting ? (
              <div className="h-4 w-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className={cn('h-4 w-4', text.trim() ? 'text-black' : 'text-muted-foreground')} />
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────
// Renders comment content with @handle tokens turned into clickable chips.
// Mentioned users (resolved by the API) are passed in so we can highlight
// known mentions in gold; unknown @handles still render as plain text.
function renderContentWithMentions(
  content: string,
  mentionedUsers: Array<{ id: string; name: string; handle: string }>,
  onClick: (handle: string) => void,
) {
  if (!content) return null;
  const mentionSet = new Set(mentionedUsers.map((u) => u.handle.toLowerCase()));
  const parts: React.ReactNode[] = [];
  const regex = /@([a-zA-Z0-9_]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    const handle = match[1];
    const startIndex = match.index;
    if (startIndex > lastIndex) {
      parts.push(content.slice(lastIndex, startIndex));
    }
    const isKnown = mentionSet.has(handle.toLowerCase());
    parts.push(
      isKnown ? (
        <button
          key={`m-${key++}`}
          onClick={() => onClick(handle)}
          className="inline font-semibold text-gold hover:underline"
        >
          @{handle}
        </button>
      ) : (
        <span key={`m-${key++}`} className="font-medium text-foreground/90">@{handle}</span>
      ),
    );
    lastIndex = startIndex + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  return <>{parts}</>;
}

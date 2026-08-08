'use client';
import { apiFetch } from '@/lib/api';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Image as ImageIcon, Smile, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatTime } from '@/lib/format';

export function CommentSheet({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userProfile = useAuthStore((s) => s.userProfile);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [text, setText] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; user: { name: string; avatarInitials: string; isVerified: boolean }; content: string; likeCount: number; createdAt: string }>>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComments() {
      try {
        const res = await apiFetch(`/api/comments?postId=${itemId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (e) { }
      setLoading(false);
    }
    loadComments();
  }, [itemId]);

  const handleSubmit = async () => {
    if (!isAuthenticated) { onClose(); setLoginModalOpen(true); return; }
    if (!text.trim()) return;
    try {
      const res = await apiFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: itemId, content: text.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [newComment, ...prev]);
        setText('');
      }
    } catch { }
  };

  const handleReply = (commentId: string) => {
    if (!isAuthenticated) { onClose(); setLoginModalOpen(true); return; }
    const r = replies[commentId];
    if (!r?.trim()) return;
    setReplies(prev => ({ ...prev, [commentId]: '' }));
    setReplyingTo(null);
  };

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
        <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-surface-border">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 mx-auto h-1 w-10 rounded-full bg-surface-border" />
          <h3 className="text-sm font-bold text-white">Comments</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface/50 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Comments List - This scrolls independently */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No comments yet</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-gold">
                  {c.user.avatarInitials}
                </div>
                <div className="flex-1">
                  <div className="rounded-2xl bg-surface px-3 py-2">
                    <p className="text-xs font-semibold text-white mb-0.5">{c.user.name}</p>
                    <p className="text-sm text-foreground/90">{c.content}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-4 px-1">
                    <span className="text-[10px] text-muted-foreground">{formatTime(c.createdAt)}</span>
                    <button className="text-[10px] font-semibold text-muted-foreground hover:text-white transition-colors">
                      {c.likeCount} likes
                    </button>
                    <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      className="text-[10px] font-semibold text-muted-foreground hover:text-white transition-colors">
                      Reply
                    </button>
                  </div>
                  {replyingTo === c.id && (
                    <div className="mt-2 flex items-center gap-2">
                      <input value={replies[c.id] ?? ''} onChange={(e) => setReplies(prev => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder={`Reply to ${c.user.name}...`} autoFocus
                        className="flex-1 rounded-xl bg-surface border border-surface-border px-3 py-1.5 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold" />
                      <button onClick={() => handleReply(c.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-gold">
                        <Send className="h-3 w-3 text-black" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area - Pinned to bottom */}
        <div className="flex-shrink-0 border-t border-surface-border p-4 flex items-end gap-2 bg-surface-elevated">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-bold text-black flex-shrink-0">
            {userProfile?.avatar ? userProfile.avatar.slice(0, 2).toUpperCase() : 'ME'}
          </div>
          <div className="flex-1 flex items-end gap-2 rounded-2xl bg-surface border border-surface-border px-3 py-2 focus-within:ring-1 focus-within:ring-gold">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              placeholder={isAuthenticated ? 'Add a comment...' : 'Sign in to comment...'}
              className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-muted-foreground focus:outline-none max-h-24"
              style={{ minHeight: '24px', maxHeight: '80px' }}
            />
            <button className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-gold transition-colors flex-shrink-0" title="Add photo">
              <ImageIcon className="h-4 w-4" />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-gold transition-colors flex-shrink-0" title="Add GIF">
              <Smile className="h-4 w-4" />
            </button>
          </div>
          <button onClick={handleSubmit} disabled={!text.trim()}
            className={cn('flex h-9 w-9 items-center justify-center rounded-full transition-colors flex-shrink-0',
              text.trim() ? 'bg-gold' : 'bg-surface border border-surface-border')}>
            <Send className={cn('h-4 w-4', text.trim() ? 'text-black' : 'text-muted-foreground')} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

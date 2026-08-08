'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Crown, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import type { ApiPost } from '../types';

interface FeedsTabProps {
  posts: ApiPost[];
  loading: boolean;
  avatar: string;
  name: string;
  verified: boolean;
  formatTime: (date: string) => string;
}

export function FeedsTab({ posts, loading, avatar, name, verified, formatTime }: FeedsTabProps) {
  const [feedsSubtab, setFeedsSubtab] = useState<'posts' | 'media'>('posts');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  return (
    <>
      <div className="flex gap-1 rounded-xl bg-surface p-1">
        <button onClick={() => setFeedsSubtab('posts')}
          className={cn('flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors', feedsSubtab === 'posts' ? 'bg-gold text-black' : 'text-muted-foreground')}>
          Posts
        </button>
        <button onClick={() => setFeedsSubtab('media')}
          className={cn('flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors', feedsSubtab === 'media' ? 'bg-gold text-black' : 'text-muted-foreground')}>
          Media
        </button>
      </div>

      {feedsSubtab === 'posts' && (
        loading ? (
          <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-card rounded-xl p-4"><div className="h-3 w-full rounded bg-surface animate-pulse mb-2" /><div className="h-3 w-3/4 rounded bg-surface animate-pulse" /></div>)}</div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12"><Crown className="h-7 w-7 text-muted-foreground/40 mb-2" /><p className="text-sm text-muted-foreground">No posts yet</p></div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="glass-card rounded-xl p-4 glass-card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold', verified ? 'bg-gold text-black' : 'bg-surface text-white')}>{avatar}</div>
                <span className="text-sm font-bold text-white">{name}</span>
                <span className="text-xs text-muted-foreground">· {formatTime(post.createdAt)}</span>
              </div>
              <p className="mb-3 text-sm text-foreground/90">{post.content}</p>
              <div className="flex items-center gap-4 border-t border-surface-border pt-2 text-xs text-muted-foreground">
                <button onClick={() => setLikedPosts(prev => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })}
                  className={cn('flex items-center gap-1 transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md', likedPosts.has(post.id) ? 'text-pink-400' : 'hover:text-pink-400')}>
                  <Heart className={cn('h-3.5 w-3.5', likedPosts.has(post.id) && 'fill-current')} /> {post.likeCount + (likedPosts.has(post.id) ? 1 : 0)}
                </button>
                <span className="flex items-center gap-1 p-2 min-h-[44px] min-w-[44px] rounded-md"><MessageCircle className="h-3.5 w-3.5" />{post.commentCount}</span>
                <button className="ml-auto hover:text-gold transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md"><Share2 className="h-3.5 w-3.5" /></button>
                <button className="hover:text-gold transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md"><Bookmark className="h-3.5 w-3.5" /></button>
              </div>
            </article>
          ))
        )
      )}

      {feedsSubtab === 'media' && (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square glass-card rounded-lg glass-card-hover" />)}
        </div>
      )}
    </>
  );
}

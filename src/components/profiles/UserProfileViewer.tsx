'use client';

import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Shield, Heart, MessageCircle, Share2, Bookmark, UserPlus, UserMinus, Crown } from 'lucide-react';
import { useState } from 'react';

export default function UserProfileViewer() {
  const viewingUser    = useUIStore((s) => s.viewingUser);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [following, setFollowing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'spotlight'>('posts');

  const mockPosts = [
    { id: 1, content: 'What an incredible match day! The atmosphere was unreal.', time: '2h ago', likes: 234, comments: 45 },
    { id: 2, content: 'My prediction for tonight: 3-1. Who agrees?', time: '1d ago', likes: 89, comments: 123 },
    { id: 3, content: 'Just arrived at the stadium. Buzzing for this one!', time: '3d ago', likes: 567, comments: 78 },
  ];

  return (
    <AnimatePresence>
      {viewingUser && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.3 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 80 || info.velocity.x > 500) {
              setViewingUser(null);
            }
          }}
          className="fixed inset-0 z-40 bg-background overflow-y-auto touch-pan-y"
        >
          <div className="mx-auto max-w-lg min-h-screen">
            {/* Cover */}
            <div className={cn('relative h-44 w-full bg-gradient-to-br', viewingUser.coverGradient)}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
                <button onClick={() => setViewingUser(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors">
                  <ArrowLeft className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Profile info */}
            <div className="relative -mt-14 px-4">
              <div className="flex items-end gap-4">
                <div className={cn('flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-4 border-background text-2xl font-bold',
                  viewingUser.verified ? 'bg-gold text-black' : 'bg-surface-elevated text-white')}>
                  {viewingUser.avatar}
                  {viewingUser.verified && (
                    <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-background">
                      <Shield className="h-5 w-5 text-gold" />
                    </span>
                  )}
                </div>
                <div className="mb-1 flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-black text-white truncate">{viewingUser.name}</h1>
                    {viewingUser.verified && <Shield className="h-4 w-4 text-gold flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{viewingUser.role}</p>
                </div>
              </div>

              {viewingUser.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/80">{viewingUser.bio}</p>}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-sm text-muted-foreground">{viewingUser.handle}</span>
                {viewingUser.location && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 text-gold" />{viewingUser.location}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 text-gold" />Joined {viewingUser.joined}
                </span>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Followers', value: formatCount(viewingUser.followers) },
                  { label: 'Following', value: formatCount(viewingUser.following) },
                  { label: 'Posts',     value: formatCount(viewingUser.posts) },
                ].map((s) => (
                  <div key={s.label} className="glass-card rounded-xl p-3 text-center glass-card-hover">
                    <p className="text-sm font-black text-gold">{s.value}</p>
                    <p className="text-[10px] font-medium uppercase text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button onClick={() => setFollowing(!following)}
                  className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all',
                    following ? 'glass-card text-muted-foreground' : 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]')}>
                  {following ? <><UserMinus className="h-4 w-4" /> Following</> : <><UserPlus className="h-4 w-4" /> Follow</>}
                </button>
                <button className="flex items-center justify-center rounded-xl glass-card px-4 hover:bg-surface-elevated transition-colors">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-0 z-30 mt-4 bg-background/95 backdrop-blur-xl border-b border-surface-border">
              <div className="flex gap-1 px-4 py-2">
                {(['posts', 'media', 'spotlight'] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn('flex-1 rounded-lg py-2 text-sm font-bold capitalize transition-colors',
                      activeTab === tab ? 'bg-gold text-black shadow-[0_2px_10px_rgba(245,197,24,0.2)]' : 'bg-surface text-muted-foreground hover:text-foreground')}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-3 pb-20">
              {activeTab === 'posts' && mockPosts.map((post) => (
                <article key={post.id} className="glass-card rounded-xl p-4 glass-card-hover">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                      viewingUser.verified ? 'bg-gold text-black' : 'bg-surface text-white')}>
                      {viewingUser.avatar}
                    </div>
                    <span className="text-sm font-bold text-white">{viewingUser.name}</span>
                    <span className="text-xs text-muted-foreground">· {post.time}</span>
                  </div>
                  <p className="mb-3 text-sm text-foreground/90">{post.content}</p>
                  <div className="flex items-center gap-4 border-t border-surface-border pt-2 text-xs text-muted-foreground">
                    <button onClick={() => setLikedPosts(prev => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })}
                      className={cn('flex items-center gap-1 transition-colors', likedPosts.has(post.id) ? 'text-pink-400' : 'hover:text-pink-400')}>
                      <Heart className={cn('h-3.5 w-3.5', likedPosts.has(post.id) && 'fill-current')} />
                      {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                    </button>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.comments}</span>
                    <button className="ml-auto hover:text-gold transition-colors"><Share2 className="h-3.5 w-3.5" /></button>
                    <button className="hover:text-gold transition-colors"><Bookmark className="h-3.5 w-3.5" /></button>
                  </div>
                </article>
              ))}

              {activeTab === 'media' && (
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`aspect-square glass-card rounded-lg glass-card-hover`} />
                  ))}
                </div>
              )}

              {activeTab === 'spotlight' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl glass-card mb-4">
                    <Crown className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">No spotlight videos yet</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';
import { apiFetch } from '@/lib/api';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, User, FileText, TrendingUp, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BadgeStack } from '@/components/ui/RoleBadge';
import { useUIStore } from '@/store/uiStore';

interface SearchUser {
  id: string; name: string; handle: string; avatar?: string;
  avatarUrl?: string | null; avatarInitials?: string | null;
  role: string; isVerified: boolean; bio: string | null;
  followerCount: number; followingCount: number; postCount: number;
  coverGradient: string; location: string | null;
  registeredAt: string; verificationStatus: string;
}
interface SearchPost {
  id: string; content: string; postType: string; createdAt: string;
  likeCount: number; commentCount: number;
  user: { name: string; handle: string; avatarUrl?: string | null; avatar?: string; role: string; isVerified: boolean; };
}
interface SearchResults { users: SearchUser[]; posts: SearchPost[]; }

const TRENDING = ['Simba SC', 'Yanga SC', 'Premier League', 'Champions League', 'AFCON'];

function UserAvatar({ user, size = 'sm' }: { user: { avatarUrl?: string | null; avatarInitials?: string | null; avatar?: string; name: string }; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs';
  if (user.avatarUrl) return <img src={user.avatarUrl} alt={user.name} className={cn('rounded-full object-cover flex-shrink-0', dim)} />;
  const initials = user.avatarInitials || user.avatar || user.name.slice(0, 2).toUpperCase();
  return <div className={cn('rounded-full bg-gold/20 flex items-center justify-center font-bold text-gold flex-shrink-0', dim)}>{initials}</div>;
}

function postTypeIcon(type: string) {
  const icons: Record<string, string> = { poll: '📊', prediction: '🎯', spotlight: '🎬', photo: '📷' };
  return icons[type] || '💬';
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'posts'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  useEffect(() => {
    if (open) {
      setQuery(''); setResults({ users: [], posts: [] }); setActiveTab('all');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults({ users: [], posts: [] }); setLoading(false); return; }
    setLoading(true);
    try {
      const [usersRes, postsRes] = await Promise.all([
        apiFetch(`/api/users?q=${encodeURIComponent(q)}&limit=6`),
        apiFetch(`/api/feed?q=${encodeURIComponent(q)}&limit=5`),
      ]);
      setResults({
        users: usersRes.ok ? await usersRes.json() : [],
        posts: postsRes.ok ? await postsRes.json() : [],
      });
    } catch { setResults({ users: [], posts: [] }); }
    setLoading(false);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults({ users: [], posts: [] }); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleUserClick = (user: SearchUser) => {
    setViewingUser({
      id: user.id,
      name: user.name,
      handle: user.handle,
      avatar: user.avatarInitials || user.avatar || user.name.slice(0, 2).toUpperCase(),
      verified: user.isVerified,
      coverGradient: user.coverGradient || 'from-emerald-600 to-emerald-900',
      bio: user.bio || '',
      role: user.role,
      location: user.location || '',
      joined: user.registeredAt,
      followers: user.followerCount,
      following: user.followingCount,
      posts: user.postCount,
      isFollowing: false,
    });
    onClose();
  };

  const hasResults = results.users.length > 0 || results.posts.length > 0;
  const showEmpty = query.trim().length > 1 && !loading && !hasResults;
  const displayUsers = activeTab === 'posts' ? [] : results.users;
  const displayPosts = activeTab === 'people' ? [] : results.posts;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex flex-col items-center pt-4 px-3"
          onClick={onClose}>
          <motion.div initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }} transition={{ duration: 0.18 }}
            className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>

            {/* Input bar */}
            <div className="relative flex items-center rounded-2xl bg-surface-elevated border border-surface-border shadow-2xl overflow-hidden">
              <div className="pl-4 flex-shrink-0">
                {loading ? <Loader2 className="h-4 w-4 text-gold animate-spin" /> : <Search className="h-4 w-4 text-muted-foreground" />}
              </div>
              <input ref={inputRef} type="text" value={query} onChange={(e) => handleChange(e.target.value)}
                placeholder="Search players, teams, posts..." autoComplete="off"
                className="flex-1 bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none" />
              {query
                ? <button onClick={() => handleChange('')} className="pr-4"><X className="h-4 w-4 text-muted-foreground hover:text-white transition-colors" /></button>
                : <button onClick={onClose} className="pr-4 text-xs text-muted-foreground hover:text-white transition-colors">Cancel</button>}
            </div>

            {/* Results panel */}
            <AnimatePresence mode="wait">
              {(hasResults || showEmpty || !query) && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mt-2 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">

                  {hasResults && (
                    <div className="flex border-b border-surface-border px-2 pt-1">
                      {(['all', 'people', 'posts'] as const).map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                          className={cn('px-4 py-2 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px',
                            activeTab === tab ? 'border-gold text-gold' : 'border-transparent text-muted-foreground hover:text-white')}>
                          {tab}
                          {tab === 'people' && results.users.length > 0 && <span className="ml-1 rounded-full bg-surface px-1.5 py-0.5 text-[9px]">{results.users.length}</span>}
                          {tab === 'posts' && results.posts.length > 0 && <span className="ml-1 rounded-full bg-surface px-1.5 py-0.5 text-[9px]">{results.posts.length}</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="overflow-y-auto">
                    {/* Trending chips */}
                    {!query.trim() && (
                      <div className="p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-gold uppercase tracking-wider">
                          <TrendingUp className="h-3 w-3" /> Trending
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {TRENDING.map((t) => (
                            <button key={t} onClick={() => handleChange(t)}
                              className="rounded-full bg-surface border border-surface-border px-3 py-1.5 text-xs text-white hover:border-gold/50 hover:text-gold transition-colors">
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {showEmpty && (
                      <div className="flex flex-col items-center justify-center py-10">
                        <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Try a different name or keyword</p>
                      </div>
                    )}

                    {/* People */}
                    {displayUsers.length > 0 && (
                      <div className="p-2">
                        {activeTab === 'all' && (
                          <p className="mb-1 px-2 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <User className="h-3 w-3" /> People
                          </p>
                        )}
                        {displayUsers.map((user) => (
                          <button key={user.id} onClick={() => handleUserClick(user)}
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface transition-colors group">
                            <UserAvatar user={user} size="md" />
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-white truncate group-hover:text-gold transition-colors">{user.name}</span>
                                <BadgeStack role={user.role} isVerified={user.isVerified} size="xs" />
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{user.handle}</p>
                              {user.bio && <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{user.bio}</p>}
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end gap-1">
                              {user.followerCount > 0 && (
                                <span className="text-[10px] text-gold font-semibold">
                                  {user.followerCount >= 1000 ? `${(user.followerCount / 1000).toFixed(1)}k` : user.followerCount}
                                </span>
                              )}
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-gold transition-colors" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {activeTab === 'all' && displayUsers.length > 0 && displayPosts.length > 0 && (
                      <div className="border-t border-surface-border mx-3" />
                    )}

                    {/* Posts */}
                    {displayPosts.length > 0 && (
                      <div className="p-2">
                        {activeTab === 'all' && (
                          <p className="mb-1 px-2 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <FileText className="h-3 w-3" /> Posts
                          </p>
                        )}
                        {displayPosts.map((post) => (
                          <div key={post.id} className="rounded-xl px-3 py-2.5 hover:bg-surface transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                              <UserAvatar user={post.user} size="sm" />
                              <span className="text-xs font-semibold text-white">{post.user.name}</span>
                              <span className="text-[10px] text-muted-foreground">{post.user.handle}</span>
                              <span className="ml-auto">{postTypeIcon(post.postType)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-10">{post.content}</p>
                            <div className="flex gap-3 mt-1 pl-10">
                              <span className="text-[10px] text-muted-foreground/60">❤️ {post.likeCount}</span>
                              <span className="text-[10px] text-muted-foreground/60">💬 {post.commentCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

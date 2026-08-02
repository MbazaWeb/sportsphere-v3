'use client';

import { useUIStore } from '@/store/uiStore';
import { formatCount } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Shield, Heart, MessageCircle, Share2, Bookmark,
  UserPlus, UserMinus, Crown, ShoppingBag, Ticket, BarChart3, Info,
  Trophy, Users, Briefcase, Building, Star, ChevronRight, CreditCard, Truck,
  CheckCircle, Tag, Database, Target, MapPinned, Clock, Award, FileText,
  Newspaper, Camera, Scale, Search, ShieldCheck, GraduationCap, Globe,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { BadgeStack } from '@/components/ui/RoleBadge';

// --- API types ---
interface ApiUser {
  id: string; name: string; handle: string; avatarInitials: string;
  isVerified: boolean; coverGradient: string; bio: string; role: string;
  location: string | null; followerCount: number; followingCount: number;
  postCount: number; registeredAt: string;
  countryOfOrigin?: string | null; city?: string | null; aboutMe?: string | null;
  roleProfile?: Record<string, unknown>;
}

interface ApiPost {
  id: string; userId: string; content: string; postType: string;
  mediaUrls: string[]; likeCount: number; commentCount: number;
  shareCount: string; createdAt: string;
}

// Role-aware tab configuration
// Posts + Media are combined into "Feeds" (id: 'feeds')
// Shop + Tickets are combined into "Shop" (id: 'shop') for teams/businesses/stadiums
function getTabsForRole(role: string): Array<{ id: string; label: string }> {
  const feeds = [{ id: 'feeds', label: 'Feeds' }];

  switch (role) {
    case 'team':
      return [
        { id: 'overview', label: 'Overview' },
        ...feeds,
        { id: 'squad', label: 'Squad' },
        { id: 'shop', label: 'Shop' },   // combines products + tickets
        { id: 'about', label: 'About' },
      ];
    case 'business':
      return [
        { id: 'overview', label: 'Overview' },
        ...feeds,
        { id: 'shop', label: 'Shop' },
        { id: 'about', label: 'About' },
      ];
    case 'player':
      return [
        { id: 'overview', label: 'Overview' },
        ...feeds,
        { id: 'stats', label: 'Stats' },
        { id: 'career', label: 'Career' },
        { id: 'about', label: 'About' },
      ];
    case 'coach':
      return [
        { id: 'overview', label: 'Overview' },
        ...feeds,
        { id: 'stats', label: 'Stats' },
        { id: 'about', label: 'About' },
      ];
    case 'analyst':
      return [
        { id: 'overview', label: 'Overview' },
        ...feeds,
        { id: 'tools', label: 'Tools' },
        { id: 'about', label: 'About' },
      ];
    case 'stadium':
    case 'venue':
      return [
        { id: 'overview', label: 'Overview' },
        ...feeds,
        { id: 'facilities', label: 'Facilities' },
        { id: 'shop', label: 'Shop' },   // combines tickets + facilities
        { id: 'about', label: 'About' },
      ];
    case 'journalist':
      return [
        { id: 'overview', label: 'Overview' },
        ...feeds,
        { id: 'articles', label: 'Articles' },
        { id: 'about', label: 'About' },
      ];
    case 'creator':
      return [
        { id: 'overview', label: 'Overview' },
        ...feeds,
        { id: 'spotlight', label: 'Spotlight' },
        { id: 'about', label: 'About' },
      ];
    default:
      return [...feeds, { id: 'spotlight', label: 'Spotlight' }, { id: 'about', label: 'About' }];
  }
}

export default function UserProfileViewer() {
  const viewingHandle = useUIStore((s) => s.viewingUser?.handle);
  const viewingUser = useUIStore((s) => s.viewingUser);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [following, setFollowing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('overview');
  const [feedsSubtab, setFeedsSubtab] = useState<'posts' | 'media'>('posts');
  const [peopleListOpen, setPeopleListOpen] = useState<'followers' | 'following' | null>(null);
  const [userPosts, setUserPosts] = useState<ApiPost[]>([]);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(false);

  // If we have a handle, fetch user data from API
  useEffect(() => {
    if (!viewingHandle) return;
    async function loadUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?handle=${encodeURIComponent(viewingHandle as string)}`);
        if (res.ok) {
          const data = await res.json();
          setApiUser(data);
          setViewingUser({
            id: data.id,
            name: data.name,
            handle: data.handle,
            avatar: data.avatarInitials,
            verified: data.isVerified,
            coverGradient: data.coverGradient,
            bio: data.bio || '',
            role: data.role,
            location: data.location || '',
            joined: data.registeredAt ? new Date(data.registeredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
            followers: data.followerCount || 0,
            following: data.followingCount || 0,
            posts: data.postCount || 0,
            isFollowing: false,
          });

          const postsRes = await fetch(`/api/feed?userId=${data.id}`);
          if (postsRes.ok) setUserPosts(await postsRes.json());
        }
      } catch (e) { /* ignore */ }
      setLoading(false);
    }
    loadUser();
  }, [viewingHandle, setViewingUser]);

  // Pull-to-refresh: reuse the same load logic
  const refresh = async () => {
    if (!viewingHandle) return;
    try {
      const res = await fetch(`/api/users?handle=${encodeURIComponent(viewingHandle as string)}`);
      if (res.ok) {
        const data = await res.json();
        setApiUser(data);
        setViewingUser({
          id: data.id,
          name: data.name,
          handle: data.handle,
          avatar: data.avatarInitials,
          verified: data.isVerified,
          coverGradient: data.coverGradient,
          bio: data.bio || '',
          role: data.role,
          location: data.location || '',
          joined: data.registeredAt ? new Date(data.registeredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
          followers: data.followerCount || 0,
          following: data.followingCount || 0,
          posts: data.postCount || 0,
          isFollowing: false,
        });

        const postsRes = await fetch(`/api/feed?userId=${data.id}`);
        if (postsRes.ok) setUserPosts(await postsRes.json());
      }
    } catch (e) { /* ignore */ }
  };

  const { containerRef, isRefreshing, pullProgress } = usePullToRefresh({ onRefresh: refresh, threshold: 80 });

  const user = viewingUser;
  const role = apiUser?.role || user?.role || 'fan';
  const tabs = getTabsForRole(role);

  const formatTime = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }, []);

  return (
    <AnimatePresence>
      {user && (
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
          ref={containerRef}
        >
          {/* Pull-to-refresh indicator */}
          <div style={{ transform: `translateY(${pullProgress * 40}px)` }} className="absolute top-2 left-0 right-0 flex items-center justify-center pointer-events-none">
            {isRefreshing ? (
              <div className="h-8 w-8 rounded-full bg-gold flex items-center justify-center text-black text-xs font-bold">↻</div>
            ) : pullProgress > 0 ? (
              <div className="h-6 w-6 rounded-full bg-gold/25 flex items-center justify-center text-gold text-xs font-bold">{Math.round(pullProgress * 100)}%</div>
            ) : null}
          </div>
          <div className="mx-auto max-w-lg min-h-screen">
            {/* Cover */}
            <div className={cn('relative h-44 w-full bg-gradient-to-br', user.coverGradient)}>
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
                <div className={cn('flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-4 border-background text-2xl font-bold relative',
                  user.verified ? 'bg-gold text-black' : 'bg-surface-elevated text-white')}>
                  {user.avatar}
                  {user.verified && (
                    <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-background">
                      <Shield className="h-5 w-5 text-gold" />
                    </span>
                  )}
                </div>
                <div className="mb-1 flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-black text-white truncate">{user.name}</h1>
                  </div>
                  <div className="mt-1">
                    <BadgeStack role={role} isVerified={user.verified} size="xs" />
                  </div>
                </div>
              </div>

              {user.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/80">{user.bio}</p>}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-sm text-muted-foreground">{user.handle}</span>
                {user.location && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 text-gold" />{user.location}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 text-gold" />Joined {user.joined}
                </span>
              </div>

              {/* Stats — Followers & Following are clickable */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Followers', value: formatCount(user.followers), clickable: true, type: 'followers' as const },
                  { label: 'Following', value: formatCount(user.following), clickable: true, type: 'following' as const },
                  { label: 'Posts',     value: formatCount(user.posts), clickable: false, type: null },
                ].map((s) => (
                  s.clickable ? (
                    <button
                      key={s.label}
                      onClick={() => setPeopleListOpen(s.type)}
                      className="glass-card rounded-xl p-3 text-center glass-card-hover hover:border-gold/30 transition-colors"
                    >
                      <p className="text-sm font-black text-gold">{s.value}</p>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">{s.label}</p>
                    </button>
                  ) : (
                    <div key={s.label} className="glass-card rounded-xl p-3 text-center glass-card-hover">
                      <p className="text-sm font-black text-gold">{s.value}</p>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">{s.label}</p>
                    </div>
                  )
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
                {/* Cart icon for fans when viewing teams/businesses */}
                {(role === 'team' || role === 'business' || role === 'stadium') && (
                  <button className="relative flex items-center justify-center rounded-xl glass-card px-4 hover:bg-surface-elevated transition-colors">
                    <ShoppingBag className="h-4 w-4 text-gold" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-black">0</span>
                  </button>
                )}
              </div>
            </div>

            {/* Role-aware Tabs */}
            <div className="sticky top-0 z-30 mt-4 bg-background/95 backdrop-blur-xl border-b border-surface-border">
              <div className="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={cn('flex-shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition-colors',
                      activeTab === tab.id ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 flex flex-col gap-3 pb-20">
              {activeTab === 'overview' && <OverviewTab apiUser={apiUser} user={user} role={role} />}
              {/* Feeds tab — combines Posts + Media */}
              {activeTab === 'feeds' && (
                <>
                  {/* Sub-tabs: Posts / Media */}
                  <div className="flex gap-1 rounded-xl bg-surface p-1">
                    <button
                      onClick={() => setFeedsSubtab('posts')}
                      className={cn('flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors',
                        feedsSubtab === 'posts' ? 'bg-gold text-black' : 'text-muted-foreground')}
                    >
                      Posts
                    </button>
                    <button
                      onClick={() => setFeedsSubtab('media')}
                      className={cn('flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors',
                        feedsSubtab === 'media' ? 'bg-gold text-black' : 'text-muted-foreground')}
                    >
                      Media
                    </button>
                  </div>

                  {feedsSubtab === 'posts' && (
                    loading ? (
                      <div className="flex flex-col gap-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="glass-card rounded-xl p-4">
                            <div className="h-3 w-full rounded bg-surface animate-pulse mb-2" />
                            <div className="h-3 w-3/4 rounded bg-surface animate-pulse" />
                          </div>
                        ))}
                      </div>
                    ) : userPosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Crown className="h-7 w-7 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">No posts yet</p>
                      </div>
                    ) : (
                      userPosts.map((post) => (
                        <article key={post.id} className="glass-card rounded-xl p-4 glass-card-hover">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                              user.verified ? 'bg-gold text-black' : 'bg-surface text-white')}>
                              {user.avatar}
                            </div>
                            <span className="text-sm font-bold text-white">{user.name}</span>
                            <span className="text-xs text-muted-foreground">· {formatTime(post.createdAt)}</span>
                          </div>
                          <p className="mb-3 text-sm text-foreground/90">{post.content}</p>
                          <div className="flex items-center gap-4 border-t border-surface-border pt-2 text-xs text-muted-foreground">
                            <button onClick={() => setLikedPosts(prev => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })}
                              className={cn('flex items-center gap-1 transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md', likedPosts.has(post.id) ? 'text-pink-400' : 'hover:text-pink-400')}>
                              <Heart className={cn('h-3.5 w-3.5', likedPosts.has(post.id) && 'fill-current')} />
                              {post.likeCount + (likedPosts.has(post.id) ? 1 : 0)}
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
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-square glass-card rounded-lg glass-card-hover" />
                      ))}
                    </div>
                  )}
                </>
              )}
              {activeTab === 'spotlight' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl glass-card mb-4">
                    <Crown className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">No spotlight videos yet</p>
                </div>
              )}
              {/* Shop tab — combines Products + Tickets (for teams/businesses/stadiums) */}
              {activeTab === 'shop' && (
                <ShopTab role={role} />
              )}
              {activeTab === 'stats' && <StatsTab role={role} apiUser={apiUser} />}
              {activeTab === 'career' && <CareerTab />}
              {activeTab === 'tools' && <AnalystToolsTab />}
              {activeTab === 'squad' && <SquadTab />}
              {activeTab === 'facilities' && <FacilitiesTab />}
              {activeTab === 'articles' && <ArticlesTab />}
              {activeTab === 'about' && <AboutTab apiUser={apiUser} user={user} role={role} />}
            </div>
          </div>

          {/* Followers / Following list modal */}
          {peopleListOpen && apiUser && (
            <PeopleListModal
              userId={apiUser.id}
              type={peopleListOpen}
              onClose={() => setPeopleListOpen(null)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── People List Modal (Followers / Following) ────────────────
function PeopleListModal({ userId, type, onClose }: {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}) {
  const [people, setPeople] = useState<Array<{
    id: string; name: string; handle: string; avatarInitials: string | null;
    isVerified: boolean; role: string; bio: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/follows?userId=${userId}&type=${type}`);
        if (res.ok) setPeople(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [userId, type]);

  const openProfile = async (person: typeof people[number]) => {
    try {
      const res = await fetch(`/api/users?handle=${encodeURIComponent(person.handle)}`);
      if (res.ok) {
        const u = await res.json();
        setViewingUser({
          id: u.id, name: u.name, handle: u.handle, avatar: u.avatarInitials,
          verified: u.isVerified, coverGradient: u.coverGradient, bio: u.bio || '',
          role: u.role, location: u.location || '', joined: '',
          followers: u.followerCount, following: u.followingCount, posts: u.postCount,
          isFollowing: false,
        });
        onClose();
      }
    } catch { /* ignore */ }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-surface-elevated border border-surface-border"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h3 className="text-sm font-bold text-white capitalize">{type}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-surface p-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-surface-border" />
                  <div className="flex-1">
                    <div className="h-3 w-32 rounded bg-surface-border mb-2" />
                    <div className="h-2 w-20 rounded bg-surface-border" />
                  </div>
                </div>
              ))}
            </div>
          ) : people.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {type === 'following' ? 'Not following anyone yet.' : 'No followers yet.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {people.map((person) => (
                <button
                  key={person.id}
                  onClick={() => openProfile(person)}
                  className="flex items-center gap-3 rounded-xl bg-surface border border-surface-border p-3 text-left hover:border-gold/30 transition-colors w-full"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">
                    {person.avatarInitials || person.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-white truncate">{person.name}</p>
                      {person.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{person.handle}</p>
                    {person.bio && <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{person.bio}</p>}
                  </div>
                  <span className="rounded-lg bg-surface border border-surface-border px-2 py-1 text-[10px] font-semibold text-muted-foreground capitalize">
                    {person.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Overview Tab (role-specific) ─────────────────────────────
function OverviewTab({ apiUser, user, role }: { apiUser: ApiUser | null; user: NonNullable<ReturnType<typeof useUIStore.getState>['viewingUser']>; role: string }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Quick stats - Display real user data */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <BarChart3 className="h-4 w-4" /> Quick Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Followers" value={formatCount(user.followers)} />
          <StatCard label="Following" value={formatCount(user.following)} />
          <StatCard label="Posts" value={formatCount(user.posts)} />
          <StatCard label="Joined" value={user.joined} />
        </div>
      </div>

      {/* Shop preview - removed hardcoded, users can navigate to Shop tab for real products */}

      {/* About preview */}
      {apiUser?.aboutMe && (
        <div className="glass-card rounded-2xl p-4 glass-card-hover">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
            <Info className="h-4 w-4" /> About
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed">{apiUser.aboutMe}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-3 text-center">
      <p className="text-sm font-bold text-gold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Shop Tab ─────────────────────────────────────────────────
// ─── Shop Tab (combines Products + Tickets) ───────────────────
function ShopTab({ role }: { role: string }) {
  const [shopSubtab, setShopSubtab] = useState<'products' | 'tickets'>('products');

  const products: any[] = [];
  const tickets: any[] = [];

  return (
    <div>
      {/* Shop header */}
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15">
            <Tag className="h-4 w-4 text-gold" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Official Shop</p>
            <p className="text-[10px] text-muted-foreground">Powered by SportsSphere Commerce</p>
          </div>
        </div>
        <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">OPEN</span>
      </div>

      {/* Sub-tabs: Products / Tickets */}
      <div className="mb-4 flex gap-1 rounded-xl bg-surface p-1">
        <button
          onClick={() => setShopSubtab('products')}
          className={cn('flex-1 rounded-lg py-2 text-xs font-bold transition-colors',
            shopSubtab === 'products' ? 'bg-gold text-black' : 'text-muted-foreground')}
        >
          <ShoppingBag className="mr-1 inline h-3.5 w-3.5" /> Products
        </button>
        <button
          onClick={() => setShopSubtab('tickets')}
          className={cn('flex-1 rounded-lg py-2 text-xs font-bold transition-colors',
            shopSubtab === 'tickets' ? 'bg-gold text-black' : 'text-muted-foreground')}
        >
          <Ticket className="mr-1 inline h-3.5 w-3.5" /> Tickets
        </button>
      </div>

      {/* Products sub-tab */}
      {shopSubtab === 'products' && (
        <>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((item, i) => (
                <div key={i} className="glass-card rounded-xl overflow-hidden glass-card-hover">
                  <div className={cn('relative aspect-square bg-gradient-to-b flex items-center justify-center', item.gradient)}>
                    <span className="text-3xl font-black text-white/20">SS</span>
                    {item.stock === 'Sold out' && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Sold Out</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-white leading-tight">{item.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs font-bold text-gold">{item.price}</p>
                      <p className="text-[9px] text-muted-foreground">{item.usd}</p>
                    </div>
                    <p className={cn('mt-1 text-[9px] font-semibold', item.stock === 'Sold out' ? 'text-red-400' : item.stock === 'Low stock' ? 'text-yellow-400' : 'text-green-400')}>{item.stock}</p>
                    {item.stock !== 'Sold out' && (
                      <button className="mt-2 w-full rounded-lg bg-gold py-1.5 text-[10px] font-bold text-black">Add to Cart</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tickets sub-tab */}
      {shopSubtab === 'tickets' && (
        <>
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Ticket className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No tickets available</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tickets.map((t, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 glass-card-hover">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-white">{t.match}</p>
                      <p className="text-[10px] text-muted-foreground">{t.date} · {t.kickoff}</p>
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
                      t.available ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>
                      {t.available ? 'Available' : 'Sold Out'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gold mb-2">{t.price}</p>
                  {t.available && (
                    <button className="w-full rounded-xl bg-gold py-2 text-sm font-bold text-black">Pre-Book</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Payment & Delivery info (shared) */}
      <div className="mt-4 glass-card rounded-2xl p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <CreditCard className="h-3.5 w-3.5" /> Payment & Delivery
        </h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Visa', 'Mastercard'].map(p => (
            <span key={p} className="rounded bg-surface px-1.5 py-0.5 text-[9px] text-white">{p}</span>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Truck className="h-3 w-3 text-gold" /> {shopSubtab === 'tickets' ? 'Mobile ticket · Instant delivery' : '2-5 days delivery · Pickup available'}
        </p>
      </div>
    </div>
  );
}

// ─── Tickets Tab ──────────────────────────────────────────────
function TicketsTab() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15">
            <Ticket className="h-4 w-4 text-gold" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Match Tickets</p>
            <p className="text-[10px] text-muted-foreground">Pre-book · Mobile tickets</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        <Ticket className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Ticket data unavailable</p>
      </div>

      <div className="mt-4 glass-card rounded-2xl p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <CreditCard className="h-3.5 w-3.5" /> Payment
        </h3>
        <div className="flex flex-wrap gap-1">
          {['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Visa', 'Mastercard'].map(p => (
            <span key={p} className="rounded bg-surface px-1.5 py-0.5 text-[9px] text-white">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Tab (players/coaches) ──────────────────────────────
function StatsTab({ role, apiUser }: { role: string; apiUser: ApiUser | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, string>;
  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <BarChart3 className="h-4 w-4" /> Career Statistics
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(role === 'player' ? [
            { label: 'Goals', value: rp.goals || 'N/A' },
            { label: 'Assists', value: rp.assists || 'N/A' },
            { label: 'Apps', value: rp.appearances || 'N/A' },
            { label: 'Position', value: rp.position || 'N/A' },
            { label: 'Height', value: rp.height || 'N/A' },
            { label: 'Foot', value: rp.preferredFoot || 'N/A' },
          ] : [
            { label: 'Trophies', value: rp.trophies || 'N/A' },
            { label: 'Win Rate', value: rp.winRate || 'N/A' },
            { label: 'Experience', value: rp.experience || 'N/A' },
            { label: 'Formation', value: rp.formation || 'N/A' },
            { label: 'License', value: rp.license || 'N/A' },
            { label: 'Team', value: rp.currentTeam || 'N/A' },
          ]).map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      {/* Performance graph */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <BarChart3 className="h-4 w-4" /> Last 5 Matches
        </h3>
        <div className="flex items-center justify-center py-8">
          <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Performance data unavailable</p>
        </div>
      </div>
    </div>
  );
}

// ─── Career Tab ───────────────────────────────────────────────
function CareerTab() {
  return (
    <div className="glass-card rounded-2xl p-4 glass-card-hover">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
        <Trophy className="h-4 w-4" /> Career History
      </h3>
      <div className="flex flex-col items-center justify-center py-8">
        <Trophy className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Career data unavailable</p>
      </div>
    </div>
  );
}

// ─── Analyst Tools Tab ────────────────────────────────────────
function AnalystToolsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Database className="h-8 w-8 text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground">Analysis tools unavailable</p>
    </div>
  );
}

// ─── Squad Tab ────────────────────────────────────────────────
function SquadTab() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground">Squad data unavailable</p>
    </div>
  );
}

// ─── Facilities Tab ───────────────────────────────────────────
function FacilitiesTab() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Building className="h-8 w-8 text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground">Facilities data unavailable</p>
    </div>
  );
}

// ─── Articles Tab (journalists) ───────────────────────────────
function ArticlesTab() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Newspaper className="h-8 w-8 text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground">Articles unavailable</p>
    </div>
  );
}

// ─── About Tab ────────────────────────────────────────────────
function AboutTab({ apiUser, user, role }: { apiUser: ApiUser | null; user: NonNullable<ReturnType<typeof useUIStore.getState>['viewingUser']>; role: string }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, string>;
  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <Info className="h-4 w-4" /> About
        </h3>
        {apiUser?.aboutMe ? (
          <p className="text-sm text-foreground/80 leading-relaxed">{apiUser.aboutMe}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{user.bio || 'No about info yet.'}</p>
        )}
        <div className="mt-3 flex flex-col gap-2">
          {apiUser?.countryOfOrigin && (
            <div className="flex items-center gap-2 text-xs">
              <Globe className="h-3 w-3 text-gold" />
              <span className="text-muted-foreground">Country:</span>
              <span className="text-white font-semibold">{apiUser.countryOfOrigin}</span>
            </div>
          )}
          {apiUser?.city && (
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-3 w-3 text-gold" />
              <span className="text-muted-foreground">City:</span>
              <span className="text-white font-semibold">{apiUser.city}</span>
            </div>
          )}
        </div>
      </div>

      {/* Role-specific info */}
      {Object.keys(rp).length > 0 && (
        <div className="glass-card rounded-2xl p-4 glass-card-hover">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
            <Award className="h-4 w-4" /> {role} Info
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(rp).slice(0, 6).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-surface p-3">
                <p className="text-[10px] text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-sm font-bold text-white">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

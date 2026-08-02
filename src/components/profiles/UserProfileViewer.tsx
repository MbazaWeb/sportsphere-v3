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
function getTabsForRole(role: string): Array<{ id: string; label: string }> {
  const base = [{ id: 'posts', label: 'Posts' }, { id: 'media', label: 'Media' }];

  switch (role) {
    case 'team':
      return [
        { id: 'overview', label: 'Overview' },
        ...base,
        { id: 'squad', label: 'Squad' },
        { id: 'shop', label: 'Shop' },
        { id: 'tickets', label: 'Tickets' },
        { id: 'about', label: 'About' },
      ];
    case 'business':
      return [
        { id: 'overview', label: 'Overview' },
        ...base,
        { id: 'shop', label: 'Shop' },
        { id: 'about', label: 'About' },
      ];
    case 'player':
      return [
        { id: 'overview', label: 'Overview' },
        ...base,
        { id: 'stats', label: 'Stats' },
        { id: 'career', label: 'Career' },
        { id: 'about', label: 'About' },
      ];
    case 'coach':
      return [
        { id: 'overview', label: 'Overview' },
        ...base,
        { id: 'stats', label: 'Stats' },
        { id: 'about', label: 'About' },
      ];
    case 'analyst':
      return [
        { id: 'overview', label: 'Overview' },
        ...base,
        { id: 'tools', label: 'Tools' },
        { id: 'about', label: 'About' },
      ];
    case 'stadium':
    case 'venue':
      return [
        { id: 'overview', label: 'Overview' },
        ...base,
        { id: 'facilities', label: 'Facilities' },
        { id: 'tickets', label: 'Tickets' },
        { id: 'about', label: 'About' },
      ];
    case 'journalist':
      return [
        { id: 'overview', label: 'Overview' },
        ...base,
        { id: 'articles', label: 'Articles' },
        { id: 'about', label: 'About' },
      ];
    case 'creator':
      return [
        { id: 'overview', label: 'Overview' },
        ...base,
        { id: 'spotlight', label: 'Spotlight' },
        { id: 'about', label: 'About' },
      ];
    default:
      return [...base, { id: 'spotlight', label: 'Spotlight' }, { id: 'about', label: 'About' }];
  }
}

export default function UserProfileViewer() {
  const viewingHandle = useUIStore((s) => s.viewingUser?.handle);
  const viewingUser = useUIStore((s) => s.viewingUser);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [following, setFollowing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('overview');
  const [userPosts, setUserPosts] = useState<ApiPost[]>([]);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(false);

  // If we have a handle, fetch user data from API
  useEffect(() => {
    if (!viewingHandle) return;
    async function loadUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?handle=${encodeURIComponent(viewingHandle)}`);
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
        >
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

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Followers', value: formatCount(user.followers) },
                  { label: 'Following', value: formatCount(user.following) },
                  { label: 'Posts',     value: formatCount(user.posts) },
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
              {activeTab === 'posts' && (
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
                          className={cn('flex items-center gap-1 transition-colors', likedPosts.has(post.id) ? 'text-pink-400' : 'hover:text-pink-400')}>
                          <Heart className={cn('h-3.5 w-3.5', likedPosts.has(post.id) && 'fill-current')} />
                          {post.likeCount + (likedPosts.has(post.id) ? 1 : 0)}
                        </button>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.commentCount}</span>
                        <button className="ml-auto hover:text-gold transition-colors"><Share2 className="h-3.5 w-3.5" /></button>
                        <button className="hover:text-gold transition-colors"><Bookmark className="h-3.5 w-3.5" /></button>
                      </div>
                    </article>
                  ))
                )
              )}
              {activeTab === 'media' && (
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square glass-card rounded-lg glass-card-hover" />
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
              {activeTab === 'shop' && <ShopTab role={role} />}
              {activeTab === 'tickets' && <TicketsTab />}
              {activeTab === 'stats' && <StatsTab role={role} apiUser={apiUser} />}
              {activeTab === 'career' && <CareerTab />}
              {activeTab === 'tools' && <AnalystToolsTab />}
              {activeTab === 'squad' && <SquadTab />}
              {activeTab === 'facilities' && <FacilitiesTab />}
              {activeTab === 'articles' && <ArticlesTab />}
              {activeTab === 'about' && <AboutTab apiUser={apiUser} user={user} role={role} />}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Overview Tab (role-specific) ─────────────────────────────
function OverviewTab({ apiUser, user, role }: { apiUser: ApiUser | null; user: NonNullable<ReturnType<typeof useUIStore.getState>['viewingUser']>; role: string }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Quick stats based on role */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <BarChart3 className="h-4 w-4" /> Quick Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {role === 'team' && [
            { label: 'Founded', value: '1878' },
            { label: 'Trophies', value: '66' },
            { label: 'Stadium', value: '74,310' },
            { label: 'League', value: 'PL' },
          ].map(s => <StatCard key={s.label} {...s} />)}
          {role === 'player' && [
            { label: 'Position', value: 'FW' },
            { label: 'Goals', value: '150' },
            { label: 'Assists', value: '80' },
            { label: 'Apps', value: '400' },
          ].map(s => <StatCard key={s.label} {...s} />)}
          {role === 'business' && [
            { label: 'Products', value: '450+' },
            { label: 'Rating', value: '4.6★' },
            { label: 'Countries', value: '120+' },
            { label: 'Revenue', value: '$2.8B' },
          ].map(s => <StatCard key={s.label} {...s} />)}
          {role === 'coach' && [
            { label: 'Trophies', value: '37' },
            { label: 'Win Rate', value: '72%' },
            { label: 'Experience', value: '15y' },
            { label: 'Team', value: 'Man City' },
          ].map(s => <StatCard key={s.label} {...s} />)}
          {role === 'journalist' && [
            { label: 'Articles', value: '2.4K' },
            { label: 'Accuracy', value: '99%' },
            { label: 'Experience', value: '12y' },
            { label: 'Specialty', value: 'Transfers' },
          ].map(s => <StatCard key={s.label} {...s} />)}
          {role === 'analyst' && [
            { label: 'Reports', value: '1.2K' },
            { label: 'Accuracy', value: '94%' },
            { label: 'Models', value: '120+' },
            { label: 'Leagues', value: '80+' },
          ].map(s => <StatCard key={s.label} {...s} />)}
          {role === 'creator' && [
            { label: 'Videos', value: '3.8K' },
            { label: 'Views', value: '450M' },
            { label: 'Subs', value: '2.1M' },
            { label: 'Engagement', value: '8.7%' },
          ].map(s => <StatCard key={s.label} {...s} />)}
          {role === 'stadium' && [
            { label: 'Capacity', value: '74,310' },
            { label: 'Opened', value: '1910' },
            { label: 'Surface', value: 'Grass' },
            { label: 'Tenant', value: 'Man Utd' },
          ].map(s => <StatCard key={s.label} {...s} />)}
          {!['team','player','business','coach','journalist','analyst','creator','stadium'].includes(role) && [
            { label: 'Followers', value: formatCount(user.followers) },
            { label: 'Posts', value: formatCount(user.posts) },
            { label: 'Following', value: formatCount(user.following) },
            { label: 'Joined', value: user.joined },
          ].map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      {/* Shop preview for teams/businesses */}
      {(role === 'team' || role === 'business') && (
        <div className="glass-card rounded-2xl p-4 glass-card-hover">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
              <ShoppingBag className="h-4 w-4" /> Official Shop
            </h3>
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">OPEN</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: role === 'team' ? 'Home Kit 24/25' : 'Mercurial Boots', price: 'TSh 85,000', gradient: 'from-red-600 to-red-800' },
              { name: role === 'team' ? 'Away Kit 24/25' : 'Team Kit', price: 'TSh 85,000', gradient: 'from-blue-600 to-blue-800' },
              { name: role === 'team' ? 'Training Top' : 'Training Ball', price: 'TSh 55,000', gradient: 'from-gray-600 to-gray-800' },
              { name: role === 'team' ? 'Scarf' : 'Scarf', price: 'TSh 25,000', gradient: 'from-red-500 to-yellow-600' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-surface border border-surface-border">
                <div className={cn('aspect-square bg-gradient-to-b flex items-center justify-center', item.gradient)}>
                  <span className="text-2xl font-black text-white/20">SS</span>
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-bold text-white leading-tight">{item.name}</p>
                  <p className="text-[11px] font-bold text-gold">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tickets preview for teams/stadiums */}
      {(role === 'team' || role === 'stadium') && (
        <div className="glass-card rounded-2xl p-4 glass-card-hover">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
            <Ticket className="h-4 w-4" /> Upcoming Tickets
          </h3>
          <div className="flex flex-col gap-2">
            {[
              { match: 'vs Arsenal', date: 'Dec 14', price: 'From TSh 45,000' },
              { match: 'vs Newcastle', date: 'Dec 26', price: 'From TSh 35,000' },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-surface p-3">
                <div>
                  <p className="text-sm font-bold text-white">{t.match}</p>
                  <p className="text-[10px] text-muted-foreground">{t.date} · {t.price}</p>
                </div>
                <span className="rounded-lg bg-gold px-3 py-1 text-[10px] font-bold text-black uppercase">Pre-book</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
function ShopTab({ role }: { role: string }) {
  const products = role === 'business'
    ? [
        { name: 'Mercurial Boots', price: 'TSh 180,000', usd: '$95', gradient: 'from-purple-600 to-pink-700', stock: 'In stock' },
        { name: 'Team Kit 24/25', price: 'TSh 85,000', usd: '$45', gradient: 'from-blue-600 to-cyan-700', stock: 'In stock' },
        { name: 'Training Ball', price: 'TSh 45,000', usd: '$24', gradient: 'from-orange-600 to-red-700', stock: 'Low stock' },
        { name: 'Supporter Scarf', price: 'TSh 25,000', usd: '$13', gradient: 'from-red-500 to-yellow-600', stock: 'Sold out' },
      ]
    : [
        { name: 'Home Kit 24/25', price: 'TSh 85,000', usd: '$45', gradient: 'from-red-600 to-red-800', stock: 'In stock' },
        { name: 'Away Kit 24/25', price: 'TSh 85,000', usd: '$45', gradient: 'from-blue-600 to-blue-800', stock: 'In stock' },
        { name: 'Training Top', price: 'TSh 55,000', usd: '$29', gradient: 'from-gray-600 to-gray-800', stock: 'Low stock' },
        { name: 'Scarf', price: 'TSh 25,000', usd: '$13', gradient: 'from-red-500 to-yellow-600', stock: 'Sold out' },
      ];

  return (
    <div>
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
          <Truck className="h-3 w-3 text-gold" /> 2-5 days delivery · Pickup available
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

      <div className="flex flex-col gap-3">
        {[
          { match: 'vs Arsenal', date: 'Sat Dec 14', kickoff: '17:30', price: 'From TSh 45,000', available: true },
          { match: 'vs Newcastle', date: 'Thu Dec 26', kickoff: '20:00', price: 'From TSh 35,000', available: true },
          { match: 'vs Liverpool', date: 'Sun Jan 5', kickoff: '16:30', price: 'From TSh 55,000', available: false },
        ].map((t, i) => (
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
          {role === 'player' ? [
            { label: 'Goals', value: rp.goals || '150' },
            { label: 'Assists', value: rp.assists || '80' },
            { label: 'Apps', value: rp.appearances || '400' },
            { label: 'Position', value: rp.position || 'FW' },
            { label: 'Height', value: rp.height || '180cm' },
            { label: 'Foot', value: rp.preferredFoot || 'Right' },
          ] : [
            { label: 'Trophies', value: '37' },
            { label: 'Win Rate', value: '72%' },
            { label: 'Experience', value: '15y' },
            { label: 'Formation', value: rp.formation || '4-3-3' },
            { label: 'License', value: rp.license || 'UEFA Pro' },
            { label: 'Team', value: rp.currentTeam || 'Man City' },
          ].map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      {/* Performance graph */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <BarChart3 className="h-4 w-4" /> Last 5 Matches
        </h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {[3, 2, 1, 2, 1].map((rating, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={cn('w-full rounded-t',
                rating === 3 ? 'bg-green-500' : rating === 2 ? 'bg-yellow-500' : 'bg-red-500'
              )} style={{ height: `${(rating / 3) * 100}%` }} />
              <span className="text-[9px] text-muted-foreground">M{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px]">
          <span className="text-green-400">Win</span>
          <span className="text-yellow-400">Draw</span>
          <span className="text-red-400">Loss</span>
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
      <div className="flex flex-col gap-3">
        {[
          { club: 'Manchester United', period: '2020 - Present', apps: 180, goals: 75 },
          { club: 'Academy', period: '2016 - 2020', apps: 60, goals: 25 },
        ].map((c, i) => (
          <div key={i} className="rounded-xl bg-surface p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-white">{c.club}</p>
              <span className="text-[10px] text-muted-foreground">{c.period}</span>
            </div>
            <div className="flex gap-4 text-[10px] text-muted-foreground">
              <span>Apps: <span className="text-white font-bold">{c.apps}</span></span>
              <span>Goals: <span className="text-white font-bold">{c.goals}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Analyst Tools Tab ────────────────────────────────────────
function AnalystToolsTab() {
  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <BarChart3 className="h-4 w-4" /> Performance Graph
        </h3>
        <div className="flex items-end justify-between gap-1 h-32">
          {[65, 72, 80, 68, 85, 92, 78, 88, 95, 90].map((val, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-cyan-500 to-blue-400" style={{ height: `${val}%` }} />
          ))}
        </div>
      </div>
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <Target className="h-4 w-4" /> xG Analysis
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface p-3">
            <p className="text-[10px] text-muted-foreground uppercase">xG For</p>
            <p className="text-xl font-black text-green-400">2.34</p>
          </div>
          <div className="rounded-xl bg-surface p-3">
            <p className="text-[10px] text-muted-foreground uppercase">xG Against</p>
            <p className="text-xl font-black text-red-400">0.89</p>
          </div>
        </div>
      </div>
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <Database className="h-4 w-4" /> Models
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { name: 'xG Model v3.2', accuracy: 94 },
            { name: 'PPDA Pressure', accuracy: 87 },
          ].map((m, i) => (
            <div key={i} className="rounded-xl bg-surface p-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white">{m.name}</span>
                <span className="text-cyan-400 font-bold">{m.accuracy}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-border">
                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${m.accuracy}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Squad Tab ────────────────────────────────────────────────
function SquadTab() {
  return (
    <div className="glass-card rounded-2xl p-4 glass-card-hover">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
        <Users className="h-4 w-4" /> Squad
      </h3>
      <div className="flex flex-col gap-2">
        {[
          { name: 'Marcus Rashford', pos: 'FW', num: 10 },
          { name: 'Bruno Fernandes', pos: 'MF', num: 8 },
          { name: 'Casemiro', pos: 'MF', num: 18 },
          { name: 'Lisandro Martínez', pos: 'DF', num: 6 },
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-surface p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">{p.num}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">{p.pos}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Facilities Tab ───────────────────────────────────────────
function FacilitiesTab() {
  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <Building className="h-4 w-4" /> Stadium Info
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Capacity" value="74,310" />
          <StatCard label="Opened" value="1910" />
          <StatCard label="Surface" value="Grass" />
          <StatCard label="Pitch" value="105×68m" />
        </div>
      </div>
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <MapPin className="h-4 w-4" /> Location & Parking
        </h3>
        <p className="text-sm text-white">Sir Matt Busby Way, Manchester M16 0RA</p>
        <p className="text-[10px] text-muted-foreground mt-1">3,000 parking spaces · Metro access</p>
      </div>
    </div>
  );
}

// ─── Articles Tab (journalists) ───────────────────────────────
function ArticlesTab() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { title: 'Breaking: Major transfer confirmed', time: '5m ago' },
        { title: 'Match preview: Key tactical battles', time: '30m ago' },
        { title: 'Injury update ahead of the weekend', time: '2h ago' },
      ].map((a, i) => (
        <div key={i} className="glass-card rounded-xl p-3 glass-card-hover">
          <p className="text-sm font-bold text-white">{a.title}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{a.time}</p>
        </div>
      ))}
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

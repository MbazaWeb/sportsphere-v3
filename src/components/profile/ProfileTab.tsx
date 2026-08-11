'use client';
import { apiFetch } from '@/lib/api';

import { useAppStore, type ProfileTypeId } from '@/store/useAppStore';
import type { VerificationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, LogOut, ChevronRight, ChevronLeft, Heart, UserPlus, MessageCircle,
  Bookmark, Trophy, Users, BarChart3, X, Shield, Bell, Mail,
  Palette, Globe, HelpCircle, Info, Edit, Camera,
  Eye, ShieldCheck, Clock, CheckCircle2, AlertCircle, Sparkles,
  BadgeCheck, Upload, ChevronDown, Zap, Video, Image as ImageIcon,
  Share2, MapPin, Calendar, Link, Briefcase, School, Award,
  Target, Flame, Crown, Star, Plus, Flag, Phone, Instagram, Twitter, Youtube, Linkedin, Music2
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import RegistrationModal from '@/components/registration/RegistrationModal';
import ProUpgradeModal from '@/components/registration/ProUpgradeModal';
import EditProfileModal from '@/components/profile/edit/EditProfileModal';
import { ProfileCompletenessBanner } from '@/profile-engine/ProfileCompletenessBanner';
import ProfileExplorer from '@/components/profiles/ProfileExplorer';
import { BadgeStack } from '@/components/ui/RoleBadge';
import VerifyEmailModal from '@/components/auth/VerifyEmailModal';
import { formatCount } from '@/store/useAppStore';

// ---------- VERIFICATION BADGE ----------
function VerificationBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-[10px] font-semibold text-gold border border-gold/20">
          <ShieldCheck className="h-3 w-3" />
          Verified
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-[10px] font-semibold text-yellow-400 border border-yellow-500/20">
          <Clock className="h-3 w-3" />
          Pending Verification
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400 border border-red-500/20">
          <AlertCircle className="h-3 w-3" />
          Rejected
        </span>
      );
    default:
      return null;
  }
}

// ---------- GUEST PROFILE ----------
function GuestProfile() {
  const setRegistrationOpen = useAppStore((s) => s.setRegistrationOpen);
  const setLoginModalOpen = useAppStore((s) => s.setLoginModalOpen);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 pt-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <img src="/sportsphere/logo.svg" alt="SportSphere" style={{height: 80, width: 'auto'}} />
          <div className="flex items-baseline gap-0"><span style={{fontSize:28,fontWeight:900,fontStyle:'italic',color:'#fff',lineHeight:1}}>Sport</span><span style={{fontSize:28,fontWeight:900,fontStyle:'italic',color:'#F5C518',lineHeight:1}}>Sphere</span></div>
          <p className="text-sm text-muted-foreground text-center">The world&apos;s biggest sports social network.</p>
        </div>
        <div className="mb-6 flex flex-col gap-3">
          <button onClick={() => setRegistrationOpen(true)} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gold text-sm font-bold text-black transition-all hover:bg-gold/90 active:scale-[0.98]"><Sparkles className="h-5 w-5" /> Create Account</button>
          <div className="flex gap-2">
            <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-surface border border-surface-border text-sm font-semibold text-white transition-colors hover:bg-surface-elevated"><svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google</button>
            <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-surface border border-surface-border text-sm font-semibold text-white transition-colors hover:bg-surface-elevated"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 16.97 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg> Apple</button>
          </div>
          <button onClick={() => setLoginModalOpen(true)} className="h-12 rounded-xl border border-surface-border text-sm font-semibold text-muted-foreground transition-colors hover:text-white hover:bg-surface">Already have an account? Sign In</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[ { Icon: Users, label: 'Join Communities', color: 'text-purple-400', bg: 'bg-purple-500/10' }, { Icon: Trophy, label: 'Make Predictions', color: 'text-gold', bg: 'bg-gold/10' }, { Icon: BarChart3, label: 'Live Scores', color: 'text-blue-400', bg: 'bg-blue-500/10' }, { Icon: Heart, label: 'Follow Teams & Players', color: 'text-pink-400', bg: 'bg-pink-500/10' }, { Icon: BadgeCheck, label: 'Verified Profiles', color: 'text-gold', bg: 'bg-gold/10' }, { Icon: MessageCircle, label: 'Live Match Chat', color: 'text-cyan-400', bg: 'bg-cyan-500/10' }, { Icon: Bookmark, label: 'Save & Bookmark', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }, { Icon: Sparkles, label: 'Create Posts', color: 'text-sport-green', bg: 'bg-green-500/10' } ].map(({ Icon, label, color, bg }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3"><div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', bg)}><Icon className={cn('h-4 w-4', color)} /></div><span className="text-xs font-semibold text-foreground/80 leading-tight">{label}</span></div>
          ))}
        </div>
        <div className="mt-6 text-center"><div className="flex items-center justify-center gap-4"><button className="text-xs text-muted-foreground hover:text-white transition-colors">Terms of Service</button><span className="text-muted-foreground">&middot;</span><button className="text-xs text-muted-foreground hover:text-white transition-colors">Privacy Policy</button></div></div>
      </motion.div>
    </div>
  );
}

// ---------- LOGGED IN PROFILE (LINKEDIN STYLE) ----------
function LoggedInProfile({ onNavigate, onLogout }: { onNavigate: (section: string) => void; onLogout: () => void; }) {
  const userProfile = useAppStore((s) => s.userProfile);
  const [editOpen, setEditOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [verifyEmailOpen, setVerifyEmailOpen] = useState(false);

  const [activeTab] = useState<'spotlight'>('spotlight');
  const [realPosts, setRealPosts] = useState<Array<{ id: string; content: string; createdAt: string; likeCount: number; commentCount: number; postType: string; mediaUrls: string[] }>>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Array<{ id: string; targetType: string; targetName: string; targetHandle: string | null }>>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [addFavoriteOpen, setAddFavoriteOpen] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
  const [favoriteType, setFavoriteType] = useState<'TEAM' | 'PLAYER' | 'COACH' | 'COMPETITION' | 'LEAGUE' | 'NATIONAL_TEAM' | 'STADIUM' | 'SPORT'>('TEAM');
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const [favoriteError, setFavoriteError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
const [coverUploading, setCoverUploading] = useState(false);

const handleCoverFile = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      setCoverUploading(true);

      const res = await apiFetch("/api/profile/avatar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "cover",
          coverBase64: reader.result,
        }),
      });

      if (!res.ok) throw new Error();

      window.location.reload();
    } finally {
      setCoverUploading(false);
    }
  };

  reader.readAsDataURL(file);
};

const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const isVerified = userProfile?.verificationStatus === 'verified';
  const isPending = userProfile?.verificationStatus === 'pending';
  const canUpgrade = userProfile?.role === 'fan' && !isVerified && !isPending;

  const handleOpenList = (type: 'followers' | 'following') => {
    if (type === 'followers') onNavigate('followers');
    else onNavigate('following');
  };

  const moreItems = [ { id: 'saved', label: 'Saved', icon: Bookmark, color: 'text-yellow-400' }, { id: 'achievements', label: 'Achievements', icon: Trophy, color: 'text-orange-400' }, { id: 'predictions', label: 'Predictions', icon: BarChart3, color: 'text-blue-400' }, { id: 'communities', label: 'Communities', icon: Users, color: 'text-purple-400' }, { id: 'followers', label: 'Followers', icon: UserPlus, color: 'text-cyan-400' }, { id: 'following', label: 'Following', icon: Heart, color: 'text-pink-400' } ];

  useEffect(() => {
    async function loadPosts() {
      try {
        const uid = userProfile?.id;
        const url = uid ? `/api/feed?type=for-you&userId=${uid}` : `/api/feed?type=for-you`;
        const res = await apiFetch(url);
        if (res.ok) setRealPosts(await res.json());
      } catch { /* ignore */ }
      setPostsLoading(false);
    }
    loadPosts();
  }, [userProfile?.id]);

  // Fetch the user's favorites from /api/profile/favorites (replaces the
  // previously hardcoded "Manchester United / Marcus Rashford" demo data).
  useEffect(() => {
    async function loadFavorites() {
      try {
        const res = await apiFetch('/api/profile/favorites');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setFavorites(data);
        }
      } catch { /* ignore */ }
      setFavoritesLoading(false);
    }
    loadFavorites();
  }, [userProfile?.id]);

  async function removeFavorite(id: string) {
    try {
      const res = await apiFetch(`/api/profile/favorites?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) setFavorites(prev => prev.filter(f => f.id !== id));
    } catch { /* ignore */ }
  }

  async function addFavorite() {
    if (!favoriteName.trim()) {
      setFavoriteError('Please enter a name.');
      return;
    }
    setFavoriteSaving(true);
    setFavoriteError('');
    try {
      const slug = favoriteName.trim().toLowerCase().replace(/\s+/g, '-');
      const res = await apiFetch('/api/profile/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: favoriteType,
          targetId: slug,
          targetName: favoriteName.trim(),
          targetHandle: null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setFavorites(prev => [created, ...prev.filter(f => f.id !== created.id)]);
        setFavoriteName('');
        setAddFavoriteOpen(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setFavoriteError(data?.error || 'Failed to add favorite.');
      }
    } catch {
      setFavoriteError('Network error. Please try again.');
    }
    setFavoriteSaving(false);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const StatCard = ({ label, value, onClick }: { label: string; value: number | string; onClick?: () => void }) => (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl bg-surface p-3 text-center cursor-pointer hover:bg-surface-elevated transition-colors",
        onClick && "hover:border-gold/30 border border-transparent"
      )}
    >
      <p className="text-sm font-bold text-gold">{typeof value === 'number' ? formatCount(value) : value}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  );

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold text-white">Profile</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('settings')} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated"><Settings className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* 10. VERIFICATION BANNER */}
        {isPending && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 p-4">
            <div className="flex items-start gap-3"><div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-500/10"><Clock className="h-5 w-5 text-yellow-400" /></div><div className="flex-1"><h3 className="text-sm font-semibold text-yellow-400">Verification In Progress</h3><p className="mt-1 text-xs text-muted-foreground leading-relaxed">Your {userProfile?.role} profile is under review.</p><div className="mt-3 flex items-center gap-2"><span className="rounded-full bg-yellow-500/10 px-2.5 py-1 text-[10px] font-medium text-yellow-400 border border-yellow-500/20"><Clock className="mr-1 inline h-2.5 w-2.5" /> Pending</span><span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-medium text-muted-foreground border border-surface-border">Submitted {userProfile?.registeredAt ? new Date(userProfile.registeredAt).toLocaleDateString() : 'recently'}</span></div></div></div>
          </motion.div>
        )}

        {!isVerified && !isPending && userProfile?.role !== 'fan' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-2xl bg-gold/5 border border-gold/20 p-4">
            <div className="flex items-start gap-3"><div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10"><Sparkles className="h-5 w-5 text-gold" /></div><div className="flex-1"><h3 className="text-sm font-semibold text-gold">Get Verified</h3><p className="mt-1 text-xs text-muted-foreground">Verify your professional credentials to earn a verified badge.</p><button onClick={() => setUpgradeOpen(true)} className="mt-2 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-black">Upgrade to PRO</button></div></div>
          </motion.div>
        )}

        {/* Email verification banner */}
        {userProfile && !userProfile.emailVerified && (
          <button onClick={() => setVerifyEmailOpen(true)} className="mb-4 w-full rounded-xl bg-gold/10 border border-gold/20 p-3 flex items-center gap-3 text-left hover:bg-gold/15 transition-colors"><Mail className="h-5 w-5 text-gold flex-shrink-0" /><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gold">Verify your email</p><p className="text-[11px] text-muted-foreground">Confirm your email to access all features</p></div><ChevronRight className="h-4 w-4 text-gold/60 flex-shrink-0" /></button>
        )}

        {/* ---- HERO/BANNER SECTION ---- */}
        <div className="relative -mx-4">
          {/* Cover */}
          <div className={cn('relative h-36 md:h-40 w-full overflow-hidden rounded-b-3xl bg-gradient-to-br', userProfile?.coverGradient || 'from-emerald-600 to-emerald-900')}>
            {userProfile?.coverUrl && (
              <img
                src={userProfile.coverUrl}
                alt="Cover"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
            {/* Edit cover button */}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors disabled:opacity-50"
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Avatar overlapping */}
          <div className="relative -mt-10 px-4 flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className={cn('flex h-24 w-24 items-center justify-center rounded-full border-4 border-background text-2xl font-bold overflow-hidden', isVerified ? 'bg-gold text-black' : 'bg-surface-elevated text-white')}>
                  {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} alt={userProfile.name || ''} className="h-full w-full object-cover" /> : (userProfile?.avatar || '?')}
                </div>
                {/* Camera icon overlay */}
                <button onClick={() => setEditOpen(true)} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gold">
                  <Camera className="h-3.5 w-3.5 text-black" />
                </button>
                {/* Verified badge */}
                {isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-background">
                    <ShieldCheck className="h-5 w-5 text-gold" />
                  </span>
                )}
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white">{userProfile?.name || 'User'}</h2>
                  <BadgeStack role={userProfile?.role || 'fan'} isVerified={isVerified} isPro={userProfile?.isPro} typeName={userProfile?.typeName} size="sm" />
                </div>
                <p className="text-sm text-muted-foreground">{userProfile?.handle || '@user'}</p>
              </div>
            </div>
            {/* Action buttons top right */}
            <div className="flex gap-2 pb-2">
              <button onClick={() => setEditOpen(true)} className="rounded-lg bg-surface border border-surface-border px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-surface-elevated">
                <Edit className="mr-1 inline h-3 w-3" /> Edit
              </button>
            
<input
  ref={coverInputRef}
  type="file"
  accept="image/*"
  onChange={handleCoverFile}
  className="hidden"
/>

</div>
          </div>

        </div>

        {/* ---- IDENTITY CARD ---- */}
        <div className="mt-4 glass-card rounded-2xl p-4 glass-card-hover">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">{userProfile?.role} · {userProfile?.typeName}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {userProfile?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gold" />{userProfile.location}</span>}
                {userProfile?.countryOfOrigin && <span className="flex items-center gap-1"><Globe className="h-3 w-3 text-gold" />{userProfile.countryOfOrigin}</span>}
                {userProfile?.nationality && <span className="flex items-center gap-1"><Flag className="h-3 w-3 text-gold" />{userProfile.nationality}</span>}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold text-white">{formatCount(userProfile?.followerCount || 0)}</span> followers · <span className="font-semibold text-white">{formatCount(userProfile?.followingCount || 0)}</span> following
              </div>
            </div>
          </div>
        </div>

        {/* ---- PROFILE COMPLETENESS BANNER (from Profile Engine) ---- */}
        {/* Phase 4: prefer typed profile (from typed table) for custom roles,
            fall back to roleProfile JSON for generic roles. */}
        <ProfileCompletenessBanner
          role={userProfile?.role || 'fan'}
          roleProfile={(userProfile?.typedProfile as Record<string, unknown> | undefined)
            || (userProfile?.roleProfile as Record<string, unknown> | undefined)
            || {}}
          baseProfile={{
            name: userProfile?.name,
            handle: userProfile?.handle,
            bio: userProfile?.bio,
            avatarUrl: userProfile?.avatarUrl,
            location: userProfile?.location,
          }}
          onEdit={() => setEditOpen(true)}
        />

        {/* ---- ABOUT SECTION (collapsible) ---- */}
        <div className="mt-4 glass-card rounded-2xl p-4 glass-card-hover">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-gold" />
            <h3 className="text-xs font-bold text-gold uppercase tracking-wider">About</h3>
          </div>
          {userProfile?.bio ? (
            <p className="text-sm text-foreground/80 leading-relaxed">{userProfile.bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Add about section</p>
          )}
          {userProfile?.aboutMe && (
            <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{userProfile.aboutMe}</p>
          )}
        </div>

        {/* ---- ROLE PROFILE SECTION ---- */}
        {userProfile?.roleData && Object.keys(userProfile.roleData).length > 0 && (
          <div className="mt-4 glass-card rounded-2xl p-4 glass-card-hover">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-gold" />
              <h3 className="text-xs font-bold text-gold uppercase tracking-wider">{userProfile.role} Profile</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(userProfile.roleData).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-surface p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' ').trim()}</p>
                  <p className="text-sm font-bold text-white">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- SPORTS & INTERESTS ---- */}
        <div className="mt-4 glass-card rounded-2xl p-4 glass-card-hover">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-gold" />
            <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Sports & Interests</h3>
          </div>
          {userProfile?.sportsFollowing && userProfile.sportsFollowing.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {userProfile.sportsFollowing.map((sport) => (
                <span key={sport} className="rounded-xl bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold border border-gold/20">
                  {sport}
                </span>
              ))}
            </div>
          )}
          {userProfile?.interests && userProfile.interests.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {userProfile.interests.map((interest) => (
                <span key={interest} className="rounded-xl bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400 border border-purple-500/20">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ---- STATS BAR ---- */}
        <div className="mt-4 glass-card rounded-2xl p-4 glass-card-hover">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-gold" />
            <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Stats</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="Followers" value={userProfile?.followerCount || 0} onClick={() => handleOpenList('followers')} />
            <StatCard label="Following" value={userProfile?.followingCount || 0} onClick={() => handleOpenList('following')} />
            <StatCard label="Posts" value={userProfile?.postCount || 0} />
            <StatCard label="Predictions" value="-" />
          </div>
        </div>

        {/* ---- POSTS / MEDIA / SPOTLIGHT TABS ---- */}
        <div className="mt-4">
          <div className="mb-4 flex gap-1">
            {['spotlight'].map((tab) => (
              <button
                key={tab}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
                  activeTab === tab ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground'
                )}
              >
                My Spotlight
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {postsLoading ? (
              [1,2,3].map(i => (<div key={i} className="rounded-xl bg-surface-elevated border border-surface-border p-4 animate-pulse"><div className="h-3 bg-surface-border rounded w-3/4 mb-2" /><div className="h-3 bg-surface-border rounded w-1/2" /></div>))
            ) : realPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10"><Zap className="h-8 w-8 text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">No content yet</p></div>
            ) : (
              realPosts.map((post) => (
                <article key={post.id} className="rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden glass-card-hover">
                  <div className="p-4 border-b border-surface-border/30 flex items-center gap-3">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold', userProfile?.avatarUrl ? 'bg-gold/10' : (isVerified ? 'bg-gold text-black' : 'bg-surface text-white'))}>
                      {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} alt="" className="h-full w-full object-cover rounded-full" /> : (userProfile?.avatar || 'U')}
                    </div>
                    <div><p className="text-sm font-bold text-white">{userProfile?.name || 'User'}</p><span className="text-xs text-muted-foreground">· {timeAgo(post.createdAt)}</span></div>
                  </div>
                  {post.content && (<p className="px-4 py-3 text-sm leading-relaxed text-foreground/90">{post.content}</p>)}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="bg-black/20">
                      {post.postType === 'video' || post.postType === 'spotlight' ? (
                        <div className="relative aspect-video w-full overflow-hidden">
                          <video src={post.mediaUrls[0]} className="h-full w-full object-contain" controls playsInline preload="metadata" />
                          <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">▶ Video</div>
                        </div>
                      ) : (
                        <div className="relative aspect-square w-full overflow-hidden sm:aspect-[4/3]">
                          <img src={post.mediaUrls[0]} alt="Post media" className="h-full w-full object-cover" loading="lazy" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-surface-border/30 px-4 py-3">
                    <button onClick={() => setLikedPosts(prev => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })} className={cn('flex items-center gap-1.5 transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md', likedPosts.has(post.id) ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400')}>
                      <Heart className={cn('h-4 w-4', likedPosts.has(post.id) && 'fill-current')} /><span className="text-xs">{post.likeCount + (likedPosts.has(post.id) ? 1 : 0)}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md">
                      <MessageCircle className="h-4 w-4" /><span className="text-xs">{post.commentCount}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md">
                      <Share2 className="h-4 w-4" /><span className="text-xs">Share</span>
                    </button>
                    <button className="text-muted-foreground hover:text-gold transition-colors p-2 min-h-[44px] min-w-[44px] rounded-md"><Bookmark className="h-4 w-4" /></button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* ---- CONTACT & SOCIAL LINKS ---- */}
        { (userProfile?.website || userProfile?.whatsapp || userProfile?.socialInstagram || userProfile?.socialX || userProfile?.socialTikTok || userProfile?.socialLinkedIn || userProfile?.socialYouTube) && (
          <div className="mt-4 glass-card rounded-2xl p-4 glass-card-hover">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-gold" />
              <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Contact & Social</h3>
            </div>
            <div className="flex flex-col gap-2">
              {userProfile?.website && (
                <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gold hover:underline">
                  <Link className="h-4 w-4" /> {userProfile.website}
                </a>
              )}
              {userProfile?.whatsapp && (
                <a href={`https://wa.me/${userProfile?.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gold hover:underline">
                  <Phone className="h-4 w-4" /> {userProfile.whatsapp}
                </a>
              )}
              {userProfile?.socialInstagram && (
                <a href={`https://instagram.com/${userProfile?.socialInstagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gold hover:underline">
                  <Instagram className="h-4 w-4" /> {userProfile.socialInstagram}
                </a>
              )}
              {userProfile?.socialX && (
                <a href={`https://x.com/${userProfile.socialX.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gold hover:underline">
                  <Twitter className="h-4 w-4" /> {userProfile.socialX}
                </a>
              )}
              {userProfile?.socialTikTok && (
                <a href={`https://tiktok.com/@${userProfile.socialTikTok.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gold hover:underline">
                  <Music2 className="h-4 w-4" /> {userProfile.socialTikTok}
                </a>
              )}
              {userProfile?.socialLinkedIn && (
                <a href={`https://linkedin.com/in/${userProfile.socialLinkedIn.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gold hover:underline">
                  <Linkedin className="h-4 w-4" /> {userProfile.socialLinkedIn}
                </a>
              )}
              {userProfile?.socialYouTube && (
                <a href={`https://youtube.com/@${userProfile.socialYouTube.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gold hover:underline">
                  <Youtube className="h-4 w-4" /> {userProfile.socialYouTube}
                </a>
              )}
            </div>
          </div>
        )}

        {/* ---- FAVORITES (dynamic — fetched from /api/profile/favorites) ---- */}
        <div className="mt-4 glass-card rounded-2xl p-4 glass-card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-gold" />
              <h3 className="text-xs font-bold text-gold uppercase tracking-wider">Favorites</h3>
            </div>
            <button
              onClick={() => { setAddFavoriteOpen(true); setFavoriteError(''); }}
              className="flex items-center gap-1 text-xs text-gold hover:underline"
            >
              <Plus className="h-3 w-3" /> Add favorite
            </button>
          </div>

          {favoritesLoading ? (
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-7 w-24 rounded-xl bg-surface animate-pulse" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No favorites yet. Add teams, players, or competitions you follow.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favorites.map(f => (
                <span
                  key={f.id}
                  className="group inline-flex items-center gap-1.5 rounded-xl bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold border border-gold/20"
                >
                  {f.targetName}
                  <button
                    onClick={() => removeFavorite(f.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gold/70 hover:text-red-400"
                    aria-label={`Remove ${f.targetName}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Inline "Add favorite" form — toggled by the Add favorite button */}
          {addFavoriteOpen && (
            <div className="mt-3 rounded-xl border border-surface-border bg-surface p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white">Add a favorite</p>
                <button
                  onClick={() => { setAddFavoriteOpen(false); setFavoriteName(''); setFavoriteError(''); }}
                  className="text-muted-foreground hover:text-white"
                  aria-label="Close add favorite form"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={favoriteType}
                  onChange={e => setFavoriteType(e.target.value as typeof favoriteType)}
                  className="rounded-lg bg-surface-elevated border border-surface-border px-2 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="TEAM">Team</option>
                  <option value="PLAYER">Player</option>
                  <option value="COACH">Coach</option>
                  <option value="COMPETITION">Competition</option>
                  <option value="LEAGUE">League</option>
                  <option value="NATIONAL_TEAM">National Team</option>
                  <option value="STADIUM">Stadium</option>
                  <option value="SPORT">Sport</option>
                </select>
                <input
                  type="text"
                  value={favoriteName}
                  onChange={e => setFavoriteName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addFavorite(); }}
                  placeholder="e.g. Manchester United"
                  className="flex-1 rounded-lg bg-surface-elevated border border-surface-border px-3 py-2 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                  autoFocus
                />
                <button
                  onClick={addFavorite}
                  disabled={favoriteSaving}
                  className="rounded-lg bg-gold text-black px-3 py-2 text-xs font-bold hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {favoriteSaving ? 'Adding…' : 'Add'}
                </button>
              </div>
              {favoriteError && <p className="text-[11px] text-red-400">{favoriteError}</p>}
            </div>
          )}
        </div>

        {/* ---- More Section ---- */}
        <div className="mt-6">
          <button onClick={() => onNavigate('settings')} className="flex w-full items-center justify-between rounded-xl bg-surface-elevated border border-surface-border p-4 transition-colors hover:bg-surface"><span className="text-sm font-semibold text-white">More</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
          <button onClick={() => onNavigate('explore')} className="mt-2 flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 p-4 transition-colors hover:from-gold/15 hover:to-gold/10"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15"><Globe className="h-4 w-4 text-gold" /></div><div className="text-left"><span className="block text-sm font-semibold text-white">Browse Profiles</span><span className="block text-[11px] text-muted-foreground">Discover teams, players, coaches & more</span></div></div><ChevronRight className="h-4 w-4 text-gold/60" /></button>
          <div className="mt-2 grid grid-cols-3 gap-2">{moreItems.map((item) => (<button key={item.id} onClick={() => onNavigate(item.id)} className="flex flex-col items-center gap-2 rounded-xl bg-surface-elevated border border-surface-border p-4 transition-colors hover:bg-surface"><item.icon className={cn('h-5 w-5', item.color)} /><span className="text-[11px] font-medium text-muted-foreground">{item.label}</span></button>))}</div>
        </div>

        

        <button onClick={onLogout} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Logout</button>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      <ProUpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <VerifyEmailModal open={verifyEmailOpen} onClose={() => setVerifyEmailOpen(false)} />
    </div>
  );
}

// ---------- ADMIN VERIFICATION PANEL ----------
function AdminVerificationPanel() {
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const showToast = useAppStore((s) => s.showToast);
  const [showDocuments, setShowDocuments] = useState(false);
  const status = userProfile?.verificationStatus || 'pending';
  const isPending = status === 'pending';
  const isVerified = status === 'verified';
  const isRejected = status === 'rejected';

  const simulateAdminApprove = () => {
    if (!userProfile) return;
    setUserProfile({ ...userProfile, verificationStatus: 'verified' });
    showToast('Your profile has been verified! Badge awarded.');
  };
  const simulateAdminReject = () => {
    if (!userProfile) return;
    setUserProfile({ ...userProfile, verificationStatus: 'rejected' });
    showToast('Verification was not approved. Please resubmit.');
  };
  const simulateResubmit = () => {
    if (!userProfile) return;
    setUserProfile({ ...userProfile, verificationStatus: 'pending' });
    showToast('Profile resubmitted for verification.');
  };

  return (
    <div className="mt-6 rounded-2xl bg-surface border border-surface-border overflow-hidden">
      <div className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated"><ShieldCheck className="h-4.5 w-4.5 text-gold" /></div><div><h3 className="text-sm font-semibold text-white">Verification Status</h3><p className="text-[10px] text-muted-foreground">Admin review & badge system</p></div></div><VerificationBadge status={status} /></div>
      <div className="border-t border-surface-border p-4">
        <div className="mb-4 rounded-xl bg-surface-elevated p-3">
          <div className="flex items-center gap-2 mb-2">
            {isPending && <Clock className="h-4 w-4 text-yellow-400" />}
            {isVerified && <CheckCircle2 className="h-4 w-4 text-gold" />}
            {isRejected && <AlertCircle className="h-4 w-4 text-red-400" />}
            <span className="text-xs font-semibold text-white">{isPending ? 'Awaiting Review' : isVerified ? 'Verified Profile' : 'Verification Failed'}</span>
          </div>
          <p className="text-xs text-muted-foreground">{isPending && 'Your documents are being reviewed. This typically takes 1-3 business days.'}{isVerified && 'Your profile has been verified by our admin team. Your verified badge is now visible to all users.'}{isRejected && 'Your verification was not approved. Please review the requirements and resubmit.'}</p>
        </div>
        {userProfile?.roleData && Object.keys(userProfile.roleData).length > 0 && (
          <div className="mb-4"><button onClick={() => setShowDocuments(!showDocuments)} className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground">Submitted Information<ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showDocuments && 'rotate-180')} /></button><AnimatePresence>{showDocuments && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden"><div className="flex flex-col gap-1.5">{Object.entries(userProfile.roleData).filter(([, v]) => v).map(([key, value]) => (<div key={key} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2"><span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' ')}</span><span className="text-xs font-medium text-white">{value}</span></div>))}</div></motion.div>)}</AnimatePresence></div>
        )}
        <div className="flex flex-col gap-2">
          {isPending && (<><div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-3"><p className="text-[10px] text-muted-foreground text-center">Demo: Tap below to simulate admin approval or rejection</p></div><div className="flex gap-2"><button onClick={simulateAdminApprove} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-black hover:bg-gold/90 transition-colors"><CheckCircle2 className="h-3.5 w-3.5" /> Approve (Demo)</button><button onClick={simulateAdminReject} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"><X className="h-3.5 w-3.5" /> Reject (Demo)</button></div></>)}
          {isRejected && (<button onClick={simulateResubmit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-black hover:bg-gold/90 transition-colors"><Upload className="h-3.5 w-3.5" /> Resubmit for Verification</button>)}
          {isVerified && (<div className="flex items-center justify-center gap-2 rounded-xl bg-gold/10 border border-gold/20 p-3"><ShieldCheck className="h-4 w-4 text-gold" /><span className="text-xs font-semibold text-gold">Verified Badge Active</span></div>)}
        </div>
      </div>
    </div>
  );
}

// ---------- SETTINGS SECTION (real — wires to EditProfileModal + ProUpgradeModal) ----------
function SettingsSection({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) {
  const userProfile = useAppStore((s) => s.userProfile);
  const [editOpen, setEditOpen] = useState(false);
  const [editSection, setEditSection] = useState<'profile' | 'sports' | 'settings'>('profile');
  const [proOpen, setProOpen] = useState(false);

  const openEditAt = (section: typeof editSection) => {
    setEditSection(section);
    setEditOpen(true);
  };

  const isPro = userProfile?.isPro;
  const isFan = userProfile?.role === 'fan';

  const settingsSections = [
    { title: 'Account', items: [
      { id: 'edit-profile',  label: 'Edit Profile',          icon: Edit,    section: 'profile' as const },
      { id: 'sports',        label: 'Sports & Interests',     icon: Heart,   section: 'sports' as const },
    ]},
    { title: 'Preferences', items: [
      { id: 'privacy',       label: 'Privacy & Security',     icon: Eye,     section: 'settings' as const },
      { id: 'notifications', label: 'Notifications',         icon: Bell,    section: 'settings' as const },
      { id: 'appearance',    label: 'Appearance',            icon: Palette, section: 'settings' as const },
      { id: 'role',          label: 'Role Profile',           icon: Award,   section: 'settings' as const },
    ]},
    { title: 'Support', items: [
      { id: 'help',  label: 'Help',  icon: HelpCircle, section: null },
      { id: 'about', label: 'About', icon: Info,       section: null },
    ]},
  ];

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated"><X className="h-4 w-4" /></button>
          <h1 className="text-lg font-bold text-white">Settings</h1>
        </div>
      </header>
      <div className="p-4">
        {/* Pro Activation card */}
        <div className={cn(
          'mb-6 overflow-hidden rounded-2xl border p-4',
          isPro
            ? 'border-gold/30 bg-gradient-to-br from-gold/10 to-amber-500/5'
            : 'border-gold/20 bg-gradient-to-br from-gold/5 to-transparent'
        )}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold/15">
              <Sparkles className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-white">Pro Account</h3>
                {isPro && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-gold to-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                    <Sparkles className="h-2.5 w-2.5" /> Pro
                  </span>
                )}
              </div>
              {isPro ? (
                <>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    You&apos;re a Pro {userProfile?.role || 'user'}.
                    {userProfile?.proSince && (
                      <> Active since {new Date(userProfile.proSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.</>
                    )}
                  </p>
                  <p className="mt-2 text-[11px] text-gold/80">Manage your role-specific profile to unlock more features.</p>
                </>
              ) : isFan ? (
                <>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Convert your profile to a verified sports role — Player, Team, Coach, Business, Sponsor, Competition, League, and more.
                  </p>
                  <button onClick={() => setProOpen(true)} className="mt-2.5 w-full rounded-xl bg-gradient-to-r from-gold to-amber-500 py-2 text-xs font-bold text-black transition-opacity hover:opacity-90">
                    Activate Pro
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your {userProfile?.role} role is pending verification. You&apos;ll become Pro once approved.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Settings sections */}
        {settingsSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</h2>
            <div className="flex flex-col gap-1 rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.section) openEditAt(item.section);
                    else if (item.id === 'help') {
                      window.open('mailto:hello@sportssphere.fun?subject=SportSphere%20Help', '_self');
                    } else if (item.id === 'about') {
                      alert('SportSphere — The World\'s Biggest Sports Community. Version 3.0. Built with ❤️ for sports fans everywhere.');
                    }
                  }}
                  className={cn('flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface', i < section.items.length - 1 && 'border-b border-surface-border')}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm text-white">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} initialSection={editSection} />
      <ProUpgradeModal open={proOpen} onClose={() => setProOpen(false)} />
    </div>
  );
}

// ---------- GENERIC SECTION ----------
function GenericSection({ title, onBack }: { title: string; onBack: () => void }) {
  const sectionMeta: Record<string, { icon: React.ElementType; msg: string }> = { 'Saved': { icon: Bookmark, msg: 'No saved items yet. Bookmark content to revisit it.' }, 'Achievements': { icon: Trophy, msg: 'No achievements yet. Participate to earn badges.' }, 'Predictions': { icon: BarChart3, msg: 'No predictions yet. Start predicting match outcomes!' }, 'Communities': { icon: Users, msg: 'No communities yet. Join groups to connect with fans.' } };
  const meta = sectionMeta[title] || { icon: Bookmark, msg: 'No content yet. Start exploring to add items here.' };
  const Icon = meta.icon;
  return (<div><header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl"><div className="flex h-14 items-center gap-3 px-4"><button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated"><X className="h-4 w-4" /></button><h1 className="text-lg font-bold text-white">{title}</h1></div></header><div className="flex flex-col items-center justify-center px-6 pt-20"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated"><Icon className="h-7 w-7 text-muted-foreground" /></div><p className="mt-4 text-sm text-muted-foreground">{meta.msg}</p></div></div>);
}

// ---------- PEOPLE LIST ----------
function PeopleList({ title, onBack }: { title: string; onBack: () => void }) {
  const userProfile = useAppStore((s) => s.userProfile);
  const setViewingUser = useAppStore((s) => s.setViewingUser);
  const [people, setPeople] = useState<Array<{ id: string; name: string; handle: string; avatarUrl?: string | null; avatarInitials: string | null; isVerified: boolean; role: string; bio: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!userProfile?.id) { setLoading(false); return; }
      try {
        const type = title === 'Following' ? 'following' : 'followers';
        const res = await apiFetch(`/api/follows?userId=${userProfile.id}&type=${type}`);
        if (res.ok) { const data = await res.json(); setPeople(data); } else { setError('Failed to load.'); }
      } catch { setError('Network error.'); }
      setLoading(false);
    }
    loadData();
  }, [userProfile?.id, title]);

  const openProfile = async (person: typeof people[number]) => {
    try {
      const res = await apiFetch(`/api/users?handle=${person.handle}`);
      if (res.ok) {
        const u = await res.json();
        const { apiUserToViewing } = await import('@/types');
        setViewingUser(apiUserToViewing(u, false));
      }
    } catch { /* ignore */ }
  };

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4"><button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated"><X className="h-4 w-4" /></button><h1 className="text-lg font-bold text-white">{title}</h1></div>
      </header>
      <div className="p-4">
        {loading ? (<div className="flex flex-col gap-2">{[1, 2, 3, 4, 5].map((i) => (<div key={i} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3"><div className="h-10 w-10 rounded-full bg-surface animate-pulse" /><div className="flex-1"><div className="h-3 w-24 rounded bg-surface animate-pulse mb-1" /><div className="h-2 w-16 rounded bg-surface animate-pulse" /></div></div>))}</div>) : error ? (<div className="text-center py-12"><p className="text-sm text-muted-foreground">{error}</p><p className="text-xs text-muted-foreground mt-2">Follow some users to see them here.</p></div>) : people.length === 0 ? (<div className="flex flex-col items-center justify-center px-6 pt-20"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated"><Users className="h-7 w-7 text-muted-foreground" /></div><p className="mt-4 text-sm text-muted-foreground">{title === 'Following' ? 'You are not following anyone yet.' : 'No followers yet.'}</p></div>) : (<div className="flex flex-col gap-2">{people.map((person) => (<button key={person.id} onClick={() => openProfile(person)} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3 text-left hover:bg-surface transition-colors w-full"><div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gold/10 font-bold text-sm text-gold flex-shrink-0">{person.avatarUrl ? <img src={person.avatarUrl} alt={person.name} className="h-full w-full object-cover" /> : (person.avatarInitials || person.name.slice(0, 2).toUpperCase())}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-1"><p className="text-sm font-semibold text-white truncate">{person.name}</p>{person.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-gold flex-shrink-0" />}</div><p className="text-xs text-muted-foreground truncate">{person.handle}</p>{person.bio && <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{person.bio}</p>}</div><span className="rounded-lg bg-surface border border-surface-border px-3 py-1.5 text-[10px] font-semibold text-muted-foreground capitalize">{person.role}</span></button>))}</div>)}
      </div>
    </div>
  );
}

// ---------- PROFILE EXPLORER ----------
function ProfileExplorerSection({ onBack }: { onBack: () => void; }) {
  return (<div><header className="sticky top-0 z-40 flex items-center gap-3 border-b border-surface-border bg-background/95 backdrop-blur-xl px-4 py-3"><button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated"><ChevronLeft className="h-4 w-4 text-muted-foreground" /></button><h1 className="text-lg font-bold text-white">Browse Profiles</h1></header><ProfileExplorer /></div>);
}

// ---------- MAIN EXPORT ----------
export default function ProfileTab() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const logout = useAppStore((s) => s.logout);
  const profileSection = useAppStore((s) => s.profileSection);
  const setProfileSection = useAppStore((s) => s.setProfileSection);

  if (!isAuthenticated) { return (<><GuestProfile /><RegistrationModal /></>); }

  return (<div className="mx-auto max-w-lg"><RegistrationModal />{profileSection === 'main' && (<LoggedInProfile onNavigate={(s: string) => setProfileSection(s as typeof profileSection)} onLogout={logout} />)}{profileSection === 'settings' && (<SettingsSection onBack={() => setProfileSection('main')} onLogout={logout} />)}{profileSection === 'explore' && (<ProfileExplorerSection onBack={() => setProfileSection('main')} />)}{profileSection === 'saved' && <GenericSection title="Saved" onBack={() => setProfileSection('main')} />}{profileSection === 'achievements' && <GenericSection title="Achievements" onBack={() => setProfileSection('main')} />}{profileSection === 'predictions' && <GenericSection title="Predictions" onBack={() => setProfileSection('main')} />}{profileSection === 'communities' && <GenericSection title="Communities" onBack={() => setProfileSection('main')} />}{profileSection === 'followers' && <PeopleList title="Followers" onBack={() => setProfileSection('main')} />}{profileSection === 'following' && <PeopleList title="Following" onBack={() => setProfileSection('main')} />}</div>);
}

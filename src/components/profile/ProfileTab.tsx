'use client';

import { useAppStore, type ProfileTypeId } from '@/store/useAppStore';
import type { VerificationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, LogOut, ChevronRight, ChevronLeft, Heart, UserPlus, MessageCircle,
  Bookmark, Trophy, Users, BarChart3, X, Shield, Bell, Mail,
  Palette, Globe, HelpCircle, Info, Edit, Camera,
  Eye, ShieldCheck, Clock, CheckCircle2, AlertCircle, Sparkles,
  BadgeCheck, Upload, ChevronDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import RegistrationModal from '@/components/registration/RegistrationModal';
import ProUpgradeModal from '@/components/registration/ProUpgradeModal';
import EditProfileModal from '@/components/profile/edit/EditProfileModal';
import ProfileExplorer from '@/components/profiles/ProfileExplorer';
import { BadgeStack } from '@/components/ui/RoleBadge';
import VerifyEmailModal from '@/components/auth/VerifyEmailModal';

// ====== VERIFICATION BADGE COMPONENT ======
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

// ====== GUEST PROFILE (JOIN FLOW) ======
function GuestProfile() {
  const setRegistrationOpen = useAppStore((s) => s.setRegistrationOpen);
  const setLoginModalOpen = useAppStore((s) => s.setLoginModalOpen);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 pt-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="SportSphere" style={{height: 80, width: 'auto'}} />
          <div className="flex items-baseline gap-0">
            <span style={{fontSize:28,fontWeight:900,fontStyle:'italic',color:'#fff',lineHeight:1}}>Sport</span>
            <span style={{fontSize:28,fontWeight:900,fontStyle:'italic',color:'#F5C518',lineHeight:1}}>Sphere</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">The world&apos;s biggest sports social network.</p>
        </div>

        {/* Join Options */}
        <div className="mb-6 flex flex-col gap-3">
          <button
            onClick={() => setRegistrationOpen(true)}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gold text-sm font-bold text-black transition-all hover:bg-gold/90 active:scale-[0.98]"
          >
            <Sparkles className="h-5 w-5" />
            Create Account
          </button>

          <div className="flex gap-2">
            <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-surface border border-surface-border text-sm font-semibold text-white transition-colors hover:bg-surface-elevated">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-surface border border-surface-border text-sm font-semibold text-white transition-colors hover:bg-surface-elevated">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 16.97 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              Apple
            </button>
          </div>

          <button
            onClick={() => setLoginModalOpen(true)}
            className="h-12 rounded-xl border border-surface-border text-sm font-semibold text-muted-foreground transition-colors hover:text-white hover:bg-surface"
          >
            Already have an account? Sign In
          </button>
        </div>

        {/* Features — icon grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { Icon: Users,        label: 'Join Communities',    color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { Icon: Trophy,       label: 'Make Predictions',    color: 'text-gold',        bg: 'bg-gold/10'       },
            { Icon: BarChart3,    label: 'Live Scores',         color: 'text-blue-400',    bg: 'bg-blue-500/10'   },
            { Icon: Heart,        label: 'Follow Teams & Players', color: 'text-pink-400', bg: 'bg-pink-500/10'   },
            { Icon: BadgeCheck,   label: 'Verified Profiles',   color: 'text-gold',        bg: 'bg-gold/10'       },
            { Icon: MessageCircle, label: 'Live Match Chat',    color: 'text-cyan-400',    bg: 'bg-cyan-500/10'   },
            { Icon: Bookmark,     label: 'Save & Bookmark',     color: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
            { Icon: Sparkles,     label: 'Create Posts',        color: 'text-sport-green', bg: 'bg-green-500/10'  },
          ].map(({ Icon, label, color, bg }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3">
              <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', bg)}>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
              <span className="text-xs font-semibold text-foreground/80 leading-tight">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4">
            <button className="text-xs text-muted-foreground hover:text-white transition-colors">Terms of Service</button>
            <span className="text-muted-foreground">&middot;</span>
            <button className="text-xs text-muted-foreground hover:text-white transition-colors">Privacy Policy</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ====== LOGGED IN PROFILE ======
function LoggedInProfile({
  onNavigate,
  onLogout,
}: {
  onNavigate: (section: string) => void;
  onLogout: () => void;
}) {
  const userProfile = useAppStore((s) => s.userProfile);
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'spotlight'>('posts');
  const [editOpen, setEditOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [verifyEmailOpen, setVerifyEmailOpen] = useState(false);

  const isAdvanced = userProfile && userProfile.role !== 'fan';
  const isPending = userProfile?.verificationStatus === 'pending';
  const isVerified = userProfile?.verificationStatus === 'verified';
  // Phase 8: Show upgrade button for fans (not verified, not pending)
  const canUpgrade = userProfile?.role === 'fan' && !isVerified && !isPending;

  const profileTabs = [
    { id: 'posts' as const, label: 'Posts' },
    { id: 'media' as const, label: 'Media' },
    { id: 'spotlight' as const, label: 'Spotlight' },
  ];

  const moreItems = [
    { id: 'saved', label: 'Saved', icon: Bookmark, color: 'text-yellow-400' },
    { id: 'achievements', label: 'Achievements', icon: Trophy, color: 'text-orange-400' },
    { id: 'predictions', label: 'Predictions', icon: BarChart3, color: 'text-blue-400' },
    { id: 'communities', label: 'Communities', icon: Users, color: 'text-purple-400' },
    { id: 'followers', label: 'Followers', icon: UserPlus, color: 'text-cyan-400' },
    { id: 'following', label: 'Following', icon: Heart, color: 'text-pink-400' },
  ];

  const mockPosts = [
    { id: 1, content: 'What a performance from the team today! The comeback was incredible.', time: '2h ago', likes: 234, comments: 45 },
    { id: 2, content: 'Predicting a 3-1 win for Arsenal tonight. Who agrees?', time: '1d ago', likes: 89, comments: 123 },
    { id: 3, content: 'Match day atmosphere at the stadium was electric. Best game this season!', time: '3d ago', likes: 567, comments: 78 },
  ];

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold text-white">Profile</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('settings')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Info */}
      <div className="p-4">
        {/* Pending Verification Banner */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-400">Verification In Progress</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Your {userProfile?.role} profile is under review. Our admin team will verify your credentials and award you a verified badge.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-yellow-500/10 px-2.5 py-1 text-[10px] font-medium text-yellow-400 border border-yellow-500/20">
                    <Clock className="mr-1 inline h-2.5 w-2.5" />
                    Pending
                  </span>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-medium text-muted-foreground border border-surface-border">
                    Submitted {userProfile?.registeredAt ? new Date(userProfile.registeredAt).toLocaleDateString() : 'recently'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-6 flex items-start gap-4">
          <div className="relative">
            <div className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full border-2 text-2xl font-bold',
              isVerified
                ? 'border-gold bg-gold text-black'
                : isPending
                  ? 'border-yellow-400 bg-yellow-500/10 text-yellow-400'
                  : 'border-gold bg-surface-elevated text-gold'
            )}>
              {userProfile?.avatar || 'DM'}
            </div>
            <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gold">
              <Camera className="h-3.5 w-3.5 text-black" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">{userProfile?.name || 'David Mbaza'}</h2>
              {isVerified && <ShieldCheck className="h-5 w-5 text-gold" />}
            </div>
            <p className="text-sm text-muted-foreground">{userProfile?.handle || '@davidmbaza'}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <BadgeStack role={userProfile?.role || 'fan'} isVerified={isVerified} typeName={userProfile?.typeName} size="sm" />
            </div>
            <button onClick={() => setEditOpen(true)} className="mt-2 rounded-lg bg-surface border border-surface-border px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-surface-elevated">
              Edit Profile
            </button>
            {/* Phase 8: Pro Upgrade button */}
            {canUpgrade && (
              <button onClick={() => setUpgradeOpen(true)} className="mt-2 ml-2 rounded-lg bg-gradient-to-r from-gold to-yellow-500 px-3 py-1.5 text-xs font-bold text-black transition-all hover:shadow-[0_4px_20px_rgba(245,197,24,0.3)] active:scale-[0.98]">
                <Sparkles className="mr-1 inline h-3 w-3" />
                Upgrade to PRO
              </button>
            )}
          </div>
        </div>

        {/* Email verification banner — Phase 4 */}
        {userProfile && !userProfile.emailVerified && (
          <button
            onClick={() => setVerifyEmailOpen(true)}
            className="mb-4 w-full rounded-xl bg-gold/10 border border-gold/20 p-3 flex items-center gap-3 text-left hover:bg-gold/15 transition-colors"
          >
            <Mail className="h-5 w-5 text-gold flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gold">Verify your email</p>
              <p className="text-[11px] text-muted-foreground">Confirm your email to access all features</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gold/60 flex-shrink-0" />
          </button>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-4 gap-3 rounded-2xl bg-surface-elevated border border-surface-border p-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">1.2K</p>
            <p className="text-[10px] text-muted-foreground uppercase">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">345</p>
            <p className="text-[10px] text-muted-foreground uppercase">Following</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">52</p>
            <p className="text-[10px] text-muted-foreground uppercase">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">89%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Accuracy</p>
          </div>
        </div>

        {/* Sports Following (for fan profiles) */}
        {userProfile?.sportsFollowing && userProfile.sportsFollowing.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sports Following</h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.sportsFollowing.map((sport) => (
                <span key={sport} className="rounded-xl bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold border border-gold/20">
                  {sport}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content tabs */}
        <div className="mb-4 flex gap-1">
          {profileTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
                activeTab === tab.id
                  ? 'bg-gold text-black'
                  : 'bg-surface text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">
          {mockPosts.map((post) => (
            <article key={post.id} className="rounded-xl bg-surface-elevated border border-surface-border p-4">
              <p className="mb-2 text-sm text-foreground/90">{post.content}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{post.time}</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {post.comments}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* More Section */}
        <div className="mt-6">
          <button
            onClick={() => onNavigate('settings')}
            className="flex w-full items-center justify-between rounded-xl bg-surface-elevated border border-surface-border p-4 transition-colors hover:bg-surface"
          >
            <span className="text-sm font-semibold text-white">More</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Browse Profiles — directory of real users on the platform */}
          <button
            onClick={() => onNavigate('explore')}
            className="mt-2 flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 p-4 transition-colors hover:from-gold/15 hover:to-gold/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15">
                <Globe className="h-4 w-4 text-gold" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-semibold text-white">Browse Profiles</span>
                <span className="block text-[11px] text-muted-foreground">Discover teams, players, coaches & more</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gold/60" />
          </button>

          <div className="mt-2 grid grid-cols-3 gap-2">
            {moreItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center gap-2 rounded-xl bg-surface-elevated border border-surface-border p-4 transition-colors hover:bg-surface"
              >
                <item.icon className={cn('h-5 w-5', item.color)} />
                <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Admin Verification Panel (for advanced roles) */}
        {isAdvanced && (
          <AdminVerificationPanel />
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Phase 8: Pro Upgrade Modal */}
      <ProUpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {/* Phase 4: Email Verification Modal */}
      <VerifyEmailModal open={verifyEmailOpen} onClose={() => setVerifyEmailOpen(false)} />
    </div>
  );
}

// ====== ADMIN VERIFICATION PANEL ======
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
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated">
            <ShieldCheck className="h-4.5 w-4.5 text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Verification Status</h3>
            <p className="text-[10px] text-muted-foreground">Admin review & badge system</p>
          </div>
        </div>
        <VerificationBadge status={status} />
      </div>

      <div className="border-t border-surface-border p-4">
        <div className="mb-4 rounded-xl bg-surface-elevated p-3">
          <div className="flex items-center gap-2 mb-2">
            {isPending && <Clock className="h-4 w-4 text-yellow-400" />}
            {isVerified && <CheckCircle2 className="h-4 w-4 text-gold" />}
            {isRejected && <AlertCircle className="h-4 w-4 text-red-400" />}
            <span className="text-xs font-semibold text-white">
              {isPending ? 'Awaiting Review' : isVerified ? 'Verified Profile' : 'Verification Failed'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isPending && 'Your documents are being reviewed. This typically takes 1-3 business days.'}
            {isVerified && 'Your profile has been verified by our admin team. Your verified badge is now visible to all users.'}
            {isRejected && 'Your verification was not approved. Please review the requirements and resubmit.'}
          </p>
        </div>

        {userProfile?.roleData && Object.keys(userProfile.roleData).length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowDocuments(!showDocuments)}
              className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground"
            >
              Submitted Information
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showDocuments && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {showDocuments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(userProfile.roleData).filter(([, v]) => v).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                        <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-xs font-medium text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isPending && (
            <>
              <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-3">
                <p className="text-[10px] text-muted-foreground text-center">
                  Demo: Tap below to simulate admin approval or rejection
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={simulateAdminApprove}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-black hover:bg-gold/90 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve (Demo)
                </button>
                <button
                  onClick={simulateAdminReject}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Reject (Demo)
                </button>
              </div>
            </>
          )}
          {isRejected && (
            <button
              onClick={simulateResubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-black hover:bg-gold/90 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Resubmit for Verification
            </button>
          )}
          {isVerified && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-gold/10 border border-gold/20 p-3">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <span className="text-xs font-semibold text-gold">Verified Badge Active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====== SETTINGS SECTION ======
function SettingsSection({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) {
  const settingsSections = [
    {
      title: 'Account',
      items: [
        { id: 'edit-profile', label: 'Edit Profile', icon: Edit },
        { id: 'privacy', label: 'Privacy', icon: Eye },
        { id: 'security', label: 'Security', icon: Shield },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'language', label: 'Language', icon: Globe },
      ],
    },
    {
      title: 'Support',
      items: [
        { id: 'help', label: 'Help', icon: HelpCircle },
        { id: 'about', label: 'About', icon: Info },
      ],
    },
  ];

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated"
          >
            <X className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold text-white">Settings</h1>
        </div>
      </header>

      <div className="p-4">
        {settingsSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</h2>
            <div className="flex flex-col gap-1 rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.id}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface',
                    i < section.items.length - 1 && 'border-b border-surface-border'
                  )}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm text-white">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

// ====== GENERIC SECTION ======
function GenericSection({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated">
            <X className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold text-white">{title}</h1>
        </div>
      </header>
      <div className="flex flex-col items-center justify-center px-6 pt-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated">
          <Bookmark className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">No content yet. Start exploring to add items here.</p>
      </div>
    </div>
  );
}

// ====== PEOPLE LIST (Followers / Following) ======
function PeopleList({ title, onBack }: { title: string; onBack: () => void }) {
  const userProfile = useAppStore((s) => s.userProfile);
  const setViewingUser = useAppStore((s) => s.setViewingUser);
  const [people, setPeople] = useState<Array<{ id: string; name: string; handle: string; avatarInitials: string | null; isVerified: boolean; role: string; bio: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!userProfile?.id) { setLoading(false); return; }
      try {
        const type = title === 'Following' ? 'following' : 'followers';
        const res = await fetch(`/api/follows?userId=${userProfile.id}&type=${type}`);
        if (res.ok) {
          const data = await res.json();
          setPeople(data);
        } else {
          setError('Failed to load.');
        }
      } catch { setError('Network error.'); }
      setLoading(false);
    }
    loadData();
  }, [userProfile?.id, title]);

  const openProfile = async (person: typeof people[number]) => {
    try {
      const res = await fetch(`/api/users?handle=${encodeURIComponent(person.handle)}`);
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
        <div className="flex h-14 items-center gap-3 px-4">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated">
            <X className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold text-white">{title}</h1>
        </div>
      </header>
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3">
                <div className="h-10 w-10 rounded-full bg-surface animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-24 rounded bg-surface animate-pulse mb-1" />
                  <div className="h-2 w-16 rounded bg-surface animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">Follow some users to see them here.</p>
          </div>
        ) : people.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 pt-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {title === 'Following' ? 'You are not following anyone yet.' : 'No followers yet.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {people.map((person) => (
              <button
                key={person.id}
                onClick={() => openProfile(person)}
                className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3 text-left hover:bg-surface transition-colors w-full"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 font-bold text-sm text-gold">
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
                <span className="rounded-lg bg-surface border border-surface-border px-3 py-1.5 text-[10px] font-semibold text-muted-foreground capitalize">
                  {person.role}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ====== PROFILE EXPLORER SECTION (wrapped with header) ======
function ProfileExplorerSection({ onBack }: {
  onBack: () => void;
}) {
  return (
    <div>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-surface-border bg-background/95 backdrop-blur-xl px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-white">Browse Profiles</h1>
      </header>
      <ProfileExplorer />
    </div>
  );
}

// ====== MAIN EXPORT ======
export default function ProfileTab() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const logout = useAppStore((s) => s.logout);
  const profileSection = useAppStore((s) => s.profileSection);
  const setProfileSection = useAppStore((s) => s.setProfileSection);

  if (!isAuthenticated) {
    return (
      <>
        <GuestProfile />
        <RegistrationModal />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <RegistrationModal />
      {profileSection === 'main' && (
        <LoggedInProfile
          onNavigate={(s: string) => setProfileSection(s as typeof profileSection)}
          onLogout={logout}
        />
      )}
      {profileSection === 'settings' && (
        <SettingsSection
          onBack={() => setProfileSection('main')}
          onLogout={logout}
        />
      )}
      {profileSection === 'explore' && (
        <ProfileExplorerSection
          onBack={() => setProfileSection('main')}
        />
      )}
      {profileSection === 'saved' && <GenericSection title="Saved" onBack={() => setProfileSection('main')} />}
      {profileSection === 'achievements' && <GenericSection title="Achievements" onBack={() => setProfileSection('main')} />}
      {profileSection === 'predictions' && <GenericSection title="Predictions" onBack={() => setProfileSection('main')} />}
      {profileSection === 'communities' && <GenericSection title="Communities" onBack={() => setProfileSection('main')} />}
      {profileSection === 'followers' && <PeopleList title="Followers" onBack={() => setProfileSection('main')} />}
      {profileSection === 'following' && <PeopleList title="Following" onBack={() => setProfileSection('main')} />}
    </div>
  );
}

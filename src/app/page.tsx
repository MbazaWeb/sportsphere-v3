'use client';

import { useNavigationStore } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import BottomNav from '@/components/layout/BottomNav';
import HomeTab from '@/components/home/HomeTab';
import ScoresTab from '@/components/scores/ScoresTab';
import CreateTab from '@/components/create/CreateTab';
import ActivityTab from '@/components/activity/ActivityTab';
import ProfileTab from '@/components/profile/ProfileTab';
import RegistrationModal from '@/components/registration/RegistrationModal';
import ProfileExplorer from '@/components/profiles/ProfileExplorer';
import ProfilePage from '@/components/profiles/ProfilePage';
import UserProfileViewer from '@/components/profiles/UserProfileViewer';
import { PROFILE_TYPES, type ProfileTypeId } from '@/components/profiles/profileConfig';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

// ─── Login Modal ───────────────────────────────────────────────
function LoginModal() {
  const { loginModalOpen, setLoginModalOpen } = useUIStore();
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  if (!loginModalOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-3xl bg-surface-elevated border border-surface-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Sign In</h2>
          <button onClick={() => setLoginModalOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-border transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">Welcome back to SportSphere.</p>
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
          <input type="email" placeholder="your@email.com"
            className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sport-green" />
        </div>
        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
          <input type="password" placeholder="Enter your password"
            className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sport-green" />
        </div>
        <button onClick={() => { setIsAuthenticated(true); setLoginModalOpen(false); }}
          className="w-full rounded-xl bg-sport-green py-3 text-sm font-bold text-black hover:bg-sport-green/90 transition-colors">
          Sign In
        </button>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-surface-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-surface-border" />
        </div>
        <div className="mt-4 flex gap-3">
          {(['Google', 'Apple'] as const).map((p) => (
            <button key={p} onClick={() => { setIsAuthenticated(true); setLoginModalOpen(false); }}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-surface border border-surface-border text-sm font-medium text-white transition-colors hover:bg-surface-elevated">
              {p}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────
function Toast() {
  const toastMessage = useUIStore((s) => s.toastMessage);
  if (!toastMessage) return null;
  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
        className="rounded-xl bg-surface-elevated border border-surface-border px-4 py-3 shadow-xl">
        <p className="text-sm font-medium text-white">{toastMessage}</p>
      </motion.div>
    </div>
  );
}

// ─── Profile Type Overlay (17 profile types: team, player, coach...) ──
function ProfileTypeOverlay() {
  const viewingProfile = useUIStore((s) => s.viewingProfile);
  const setViewingProfile = useUIStore((s) => s.setViewingProfile);
  if (!viewingProfile) return null;
  const config = PROFILE_TYPES[viewingProfile as ProfileTypeId];
  if (!config) return null;
  return (
    <div className="fixed inset-0 z-40 bg-background overflow-y-auto">
      <ProfilePage config={config} onBack={() => setViewingProfile(null)} />
    </div>
  );
}

// ─── Tab Content ───────────────────────────────────────────────
function TabContent() {
  const activeTab = useNavigationStore((s) => s.activeTab);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setViewingProfile = useUIStore((s) => s.setViewingProfile);
  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="mx-auto min-h-screen max-w-lg">
        {activeTab === 'home'     && <HomeTab />}
        {activeTab === 'scores'   && <ScoresTab />}
        {activeTab === 'create'   && <CreateTab />}
        {activeTab === 'activity' && <ActivityTab />}
        {activeTab === 'profile'  && (
          isAuthenticated
            ? <ProfileExplorer onSelectProfile={(id) => setViewingProfile(id)} />
            : <ProfileTab />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Root Page ─────────────────────────────────────────────────
export default function Home() {
  const viewingProfile = useUIStore((s) => s.viewingProfile);
  const viewingUser    = useUIStore((s) => s.viewingUser);
  useServiceWorker();

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Toast />
      <LoginModal />
      <RegistrationModal />
      <ProfileTypeOverlay />
      <UserProfileViewer />
      <div className="flex-1 pb-16">
        <TabContent />
      </div>
      {!viewingProfile && !viewingUser && <BottomNav />}
    </div>
  );
}

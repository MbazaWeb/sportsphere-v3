'use client';
import SplashScreen from '@/components/SplashScreen';
import React from 'react';

import { useNavigationStore } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthSession } from '@/hooks/useAuthSession';
// useSwipeBack intentionally NOT imported — all swipe-to-navigate disabled for mobile UX
import BottomNav from '@/components/layout/BottomNav';
import HomeTab from '@/components/home/HomeTab';
import ScoresTab from '@/components/scores/ScoresTab';
import CreateTab from '@/components/create/CreateTab';
import ActivityTab from '@/components/activity/ActivityTab';
import ProfileTab from '@/components/profile/ProfileTab';
import LoginModal from '@/components/auth/LoginModal';
import RegistrationModal from '@/components/auth/RegistrationModal';
import ResetPasswordPage from '@/components/auth/ResetPasswordPage';
import VerifyEmailModal from '@/components/auth/VerifyEmailModal';
import ProfilePage from '@/components/profiles/ProfilePage';
import UserProfileViewer from '@/components/profiles/UserProfileViewer';
import { PROFILE_TYPES, type ProfileTypeId } from '@/components/profiles/profileConfig';
import { AnimatePresence, motion } from 'framer-motion';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useOfflinePostSync } from '@/hooks/useOfflinePostSync';

function Toast() {
  const msg = useUIStore((s) => s.toastMessage);
  if (!msg) return null;
  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
      <div className="rounded-xl bg-surface-elevated border border-surface-border px-4 py-3 shadow-xl">
        <p className="text-sm font-medium text-white">{msg}</p>
      </div>
    </div>
  );
}

function ProfileTypeOverlay() {
  const viewingProfile    = useUIStore((s) => s.viewingProfile);
  const setViewingProfile = useUIStore((s) => s.setViewingProfile);
  // Swipe-to-dismiss intentionally disabled — users navigate via back button only
  if (!viewingProfile) return null;
  const config = PROFILE_TYPES[viewingProfile as ProfileTypeId];
  if (!config) return null;
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-40 bg-background overflow-y-auto"
      style={{ touchAction: 'pan-y' }}
    >
      <ProfilePage config={config} onBack={() => setViewingProfile(null)} />
    </motion.div>
  );
}

function TabContent() {
  const activeTab = useNavigationStore((s) => s.activeTab);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);

  // Auth-only tabs — redirect unauthenticated users back to home
  const AUTH_TABS: Array<'home'|'scores'|'create'|'activity'|'profile'> = ['create', 'activity', 'profile'];
  React.useEffect(() => {
    if (!isAuthenticated && AUTH_TABS.includes(activeTab as typeof AUTH_TABS[number])) {
      setActiveTab('home');
      setLoginModalOpen(true);
    }
  // Only react to activeTab changes, not isAuthenticated changes,
  // to avoid resetting the tab when session hydrates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // All swipe-to-navigate gestures are COMPLETELY DISABLED.
  // Users navigate only via the bottom nav bar. This prevents accidental
  // page switches when scrolling or touching the screen on mobile.
  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="mx-auto min-h-screen max-w-lg"
        style={{ touchAction: 'pan-y' }}>
        {activeTab === 'home'     && <HomeTab />}
        {activeTab === 'scores'   && <ScoresTab />}
        {activeTab === 'create'   && <CreateTab />}
        {activeTab === 'activity' && <ActivityTab />}
        {activeTab === 'profile'  && <ProfileTab />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  const [splashDone, setSplashDone] = React.useState(false);
  const [verifyEmailOpen, setVerifyEmailOpen] = React.useState(false);
  const viewingProfile = useUIStore((s) => s.viewingProfile);
  const viewingUser    = useUIStore((s) => s.viewingUser);

  const setActiveTab = useNavigationStore((s) => s.setActiveTab);

  useServiceWorker();
  useAuthSession();
  useOfflinePostSync();
  if (!splashDone) return <SplashScreen onDone={() => { setActiveTab('home'); setSplashDone(true); }} />;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Toast />
      <LoginModal />
      <RegistrationModal />
      <ResetPasswordPage />
      <VerifyEmailModal open={verifyEmailOpen} onClose={() => setVerifyEmailOpen(false)} />
      <ProfileTypeOverlay />
      <UserProfileViewer />

      <div className="flex-1 pb-16"><TabContent /></div>
      {!viewingProfile && !viewingUser && <BottomNav />}
    </div>
  );
}

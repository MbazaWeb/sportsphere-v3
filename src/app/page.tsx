'use client';
import SplashScreen from '@/components/SplashScreen';
import React, { useCallback, useRef } from 'react';

import { useNavigationStore } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthSession } from '@/hooks/useAuthSession';
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
import { cn } from '@/lib/utils';
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

  const AUTH_TABS: Array<'home'|'scores'|'create'|'activity'|'profile'> = ['create', 'activity', 'profile'];
  React.useEffect(() => {
    if (!isAuthenticated && AUTH_TABS.includes(activeTab as typeof AUTH_TABS[number])) {
      setActiveTab('home');
      setLoginModalOpen(true);
    }
  }, [activeTab]);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="w-full"
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

function NavRevealZone() {
  const showNav = useNavigationStore((s) => s.showNav);
  const handleTouch = useCallback(() => { showNav(); }, [showNav]);
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[45] h-8 cursor-pointer"
      onTouchStart={handleTouch}
      onMouseDown={handleTouch}
      aria-hidden="true"
    />
  );
}

export default function Home() {
  const [splashDone, setSplashDone] = React.useState(false);
  const [verifyEmailOpen, setVerifyEmailOpen] = React.useState(false);
  const viewingProfile = useUIStore((s) => s.viewingProfile);
  const viewingUser    = useUIStore((s) => s.viewingUser);
  const navVisible     = useNavigationStore((s) => s.navVisible);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);

  useServiceWorker();
  useAuthSession();
  useOfflinePostSync();

  if (!splashDone) return <SplashScreen onDone={() => { setActiveTab('home'); setSplashDone(true); }} />;

  return (
    <div className="app-shell mx-auto flex min-h-screen flex-col">
      <Toast />
      <LoginModal />
      <RegistrationModal />
      <ResetPasswordPage />
      <VerifyEmailModal open={verifyEmailOpen} onClose={() => setVerifyEmailOpen(false)} />
      <ProfileTypeOverlay />
      <UserProfileViewer />

      <div className={cn('flex-1 transition-[padding-bottom] duration-300', navVisible ? 'pb-16' : 'pb-0')}>
        <TabContent />
      </div>

      {!viewingProfile && !viewingUser && <NavRevealZone />}
      {!viewingProfile && !viewingUser && <BottomNav />}
    </div>
  );
}

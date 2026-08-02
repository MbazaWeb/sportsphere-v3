'use client';
import SplashScreen from '@/components/SplashScreen';
import React from 'react';

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
import RegistrationModal from '@/components/registration/RegistrationModal';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import ResetPasswordPage from '@/components/auth/ResetPasswordPage';
import ProfilePage from '@/components/profiles/ProfilePage';
import UserProfileViewer from '@/components/profiles/UserProfileViewer';
import { PROFILE_TYPES, type ProfileTypeId } from '@/components/profiles/profileConfig';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

function LoginModal() {
  const { loginModalOpen, setLoginModalOpen } = useUIStore();
  const { setRegistrationOpen } = useAuthStore();
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const [forgotOpen, setForgotOpen] = React.useState(false);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setUserProfile = useAuthStore((s) => s.setUserProfile);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  if (!loginModalOpen) return null;

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      setUserProfile({
        id: data.id, name: data.name, email: data.email,
        handle: data.handle, avatar: data.avatar, role: data.role,
        verificationStatus: data.verificationStatus, bio: data.bio,
        sportsFollowing: data.sportsFollowing, registeredAt: data.registeredAt || new Date().toISOString(),
        roleData: data.roleData,
      });
      setIsAuthenticated(true);
      setLoginModalOpen(false);
      setEmail(''); setPassword('');
      // Redirect to the user's profile after successful login
      setActiveTab('profile');
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  };

  const openRegister = () => {
    setLoginModalOpen(false);
    setTimeout(() => setRegistrationOpen(true), 150);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-3xl bg-surface-elevated border border-surface-border p-6">
          <div className="mb-5 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="S" style={{height: 40, width: 'auto'}} />
              <span style={{fontSize:20,fontWeight:900,fontStyle:'italic',color:'#fff',lineHeight:1}}>Sport<span style={{color:'#F5C518'}}>Sphere</span></span>
            </div>
            <div className="flex w-full items-center justify-between">
              <h2 className="text-base font-bold text-white">Sign In</h2>
              <button onClick={() => setLoginModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold" />
          </div>
          <div className="mb-2">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-muted-foreground">Password</label>
              <button
                type="button"
                onClick={() => { setLoginModalOpen(false); setTimeout(() => setForgotOpen(true), 150); }}
                className="text-[11px] text-gold hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <PasswordInput
              value={password}
              onChange={setPassword}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
            />
          </div>
          <button onClick={handleLogin} disabled={loading || !email || !password}
            className="mt-3 w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              No account? <button onClick={openRegister} className="text-gold hover:underline">Create one</button>
            </p>
          </div>
        </motion.div>
      </div>
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}

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
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.3 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 80 || info.velocity.x > 500) {
          setViewingProfile(null);
        }
      }}
      className="fixed inset-0 z-40 bg-background overflow-y-auto touch-pan-y"
    >
      <ProfilePage config={config} onBack={() => setViewingProfile(null)} />
    </motion.div>
  );
}

function TabContent() {
  const activeTab = useNavigationStore((s) => s.activeTab);
  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="mx-auto min-h-screen max-w-lg">
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
  const viewingProfile = useUIStore((s) => s.viewingProfile);
  const viewingUser    = useUIStore((s) => s.viewingUser);
  useServiceWorker();
  useAuthSession();
  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Toast />
      <LoginModal />
      <RegistrationModal />
      <ResetPasswordPage />
      <ProfileTypeOverlay />
      <UserProfileViewer />
      <div className="flex-1 pb-16"><TabContent /></div>
      {!viewingProfile && !viewingUser && <BottomNav />}
    </div>
  );
}

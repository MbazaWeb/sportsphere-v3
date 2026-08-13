'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useNavigationStore, type TabId } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Home, Trophy, PlusCircle, Bell, User, LogIn, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

type TabConfig = {
  id: TabId;
  label: string;
  Icon: React.ElementType;
  authRequired?: boolean;
};

const ALL_TABS: TabConfig[] = [
  { id: 'home',     label: 'Home',     Icon: Home },
  { id: 'scores',   label: 'Scores',   Icon: Trophy },
  { id: 'create',   label: 'Create',   Icon: PlusCircle, authRequired: true },
  { id: 'activity', label: 'Activity', Icon: Bell,       authRequired: true },
  { id: 'profile',  label: 'Profile',  Icon: User,       authRequired: true },
];

const AUTO_HIDE_DELAY = 120000;

export default function BottomNav() {
  const activeTab         = useNavigationStore((s) => s.activeTab);
  const setActiveTab      = useNavigationStore((s) => s.setActiveTab);
  const navVisible        = useNavigationStore((s) => s.navVisible);
  const showNav           = useNavigationStore((s) => s.showNav);
  const hideNav           = useNavigationStore((s) => s.hideNav);
  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const prefersReducedMotion = useReducedMotion();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => hideNav(), AUTO_HIDE_DELAY);
  }, [hideNav]);

  useEffect(() => {
    if (navVisible) {
      resetTimer();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [navVisible, resetTimer]);

  const handleTabTap = useCallback((tabId: TabId) => {
    const tab = ALL_TABS.find((x) => x.id === tabId);
    if (tab?.authRequired && !isAuthenticated) {
      setLoginModalOpen(true);
      resetTimer();
      return;
    }
    setActiveTab(tabId);
    resetTimer();
  }, [setActiveTab, resetTimer, isAuthenticated, setLoginModalOpen]);

  const handleLoginTap = useCallback(() => {
    setLoginModalOpen(true);
    resetTimer();
  }, [setLoginModalOpen, resetTimer]);

  const visibleTabs = ALL_TABS;

  return (
    <AnimatePresence>
      {navVisible && (
        <motion.nav
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 400 }}
          className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-2xl"
          style={{ touchAction: 'manipulation', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Top glow line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

          <div className="mx-auto flex h-[60px] max-w-lg items-center justify-around px-1">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const { Icon, label } = tab;
              const isCreate = tab.id === 'create';

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabTap(tab.id)}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-[2px] py-2 min-w-[56px] transition-all duration-200 cursor-pointer',
                    isCreate ? 'min-w-[48px]' : 'min-w-[56px]',
                  )}
                >
                  {/* Active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      className={cn(
                        'absolute -top-1 rounded-2xl',
                        isCreate ? 'w-12 h-12' : 'w-14 h-10',
                        isCreate ? 'bg-gold/10' : 'bg-gold/5',
                      )}
                      transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    'relative z-10 transition-all duration-200',
                    isActive ? (isCreate ? 'text-black' : 'text-gold') : 'text-muted-foreground',
                  )}>
                    {isCreate ? (
                      <div className={cn(
                        'h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-200',
                        isActive
                          ? 'bg-gold shadow-lg shadow-gold/30 scale-105'
                          : 'bg-gold/10 border border-gold/20'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                    ) : (
                      <Icon className={cn(
                        'transition-all duration-200',
                        isActive ? 'h-[22px] w-[22px]' : 'h-5 w-5'
                      )} />
                    )}
                  </div>

                  {/* Label */}
                  {!isCreate && (
                    <span className={cn(
                      'text-[10px] font-bold transition-colors duration-200 z-10 relative',
                      isActive ? 'text-gold' : 'text-muted-foreground'
                    )}>
                      {label}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Login button */}
            {!isAuthenticated && (
              <button
                onClick={handleLoginTap}
                aria-label="Log in"
                className="relative flex items-center justify-center px-3 py-2 cursor-pointer"
              >
                <div className="flex h-8 items-center gap-1.5 rounded-full bg-gold px-4 shadow-lg shadow-gold/20">
                  <LogIn className="h-3.5 w-3.5 text-black" />
                  <span className="text-[11px] font-extrabold text-black">Login</span>
                </div>
              </button>
            )}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
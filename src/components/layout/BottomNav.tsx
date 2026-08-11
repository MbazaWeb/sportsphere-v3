'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useNavigationStore, type TabId } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Home, Trophy, PlusCircle, Bell, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

type TabConfig = {
  id: TabId;
  label: string;
  Icon: React.ElementType;
  badge?: string;
  authRequired?: boolean;
};

const ALL_TABS: TabConfig[] = [
  { id: 'home',     label: 'Home',     Icon: Home },
  { id: 'scores',   label: 'Scores',   Icon: Trophy },
  { id: 'create',   label: 'Create',   Icon: PlusCircle, authRequired: true },
  { id: 'activity', label: 'Activity', Icon: Bell,       authRequired: true },
  { id: 'profile',  label: 'Profile',  Icon: User,       authRequired: true },
];

/** How long the nav stays visible after last interaction (ms) */
const AUTO_HIDE_DELAY = 3000;

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

  // Reset the auto-hide timer whenever the nav is shown
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => hideNav(), AUTO_HIDE_DELAY);
  }, [hideNav]);

  // When nav becomes visible, start the auto-hide countdown
  useEffect(() => {
    if (navVisible) {
      resetTimer();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [navVisible, resetTimer]);

  // Handle tab tap: switch tab then restart hide timer
  const handleTabTap = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    resetTimer();
  }, [setActiveTab, resetTimer]);

  // Handle login tap
  const handleLoginTap = useCallback(() => {
    setLoginModalOpen(true);
    resetTimer();
  }, [setLoginModalOpen, resetTimer]);

  // Unauthenticated: only show Home + Scores, plus a Login button
  const visibleTabs = isAuthenticated
    ? ALL_TABS
    : ALL_TABS.filter((t) => !t.authRequired);

  return (
    <AnimatePresence>
      {navVisible && (
        <motion.nav
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 400 }}
          className="fixed bottom-0 inset-x-0 z-50 border-t border-surface-border bg-background/95 backdrop-blur-xl"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const { Icon, label, badge } = tab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabTap(tab.id)}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-[3px] px-3 py-2 min-w-[56px] transition-colors duration-150 cursor-pointer',
                    isActive ? 'text-gold' : 'text-muted-foreground'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn('h-5 w-5', tab.id === 'create' && 'h-6 w-6')} />
                    {badge && (
                      <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-gold"
                      transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}

            {/* Login button — only visible when NOT authenticated */}
            {!isAuthenticated && (
              <button
                onClick={handleLoginTap}
                aria-label="Log in"
                className="relative flex flex-col items-center justify-center gap-[3px] px-3 py-2 min-w-[56px] transition-colors duration-150 cursor-pointer text-muted-foreground hover:text-gold"
              >
                <div className="relative flex h-7 items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-3 py-1">
                  <LogIn className="h-3.5 w-3.5 text-gold" />
                  <span className="text-[11px] font-bold text-gold">Login</span>
                </div>
              </button>
            )}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

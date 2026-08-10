'use client';

import { useNavigationStore, type TabId } from '@/store/navigationStore';
import { Home, Trophy, PlusCircle, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';

type TabConfig = {
  id: TabId;
  label: string;
  Icon: React.ElementType;
  badge?: string;
};

const TABS: TabConfig[] = [
  { id: 'home',     label: 'Home',     Icon: Home },
  { id: 'scores',   label: 'Scores',   Icon: Trophy },
  { id: 'create',   label: 'Create',   Icon: PlusCircle },
  { id: 'activity', label: 'Activity', Icon: Bell },
  { id: 'profile',  label: 'Profile',  Icon: User },
];

export default function BottomNav() {
  const activeTab    = useNavigationStore((s) => s.activeTab);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const prefersReducedMotion = useReducedMotion();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-surface-border bg-background/95 backdrop-blur-xl" style={{ touchAction: 'manipulation' }}>
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const { Icon, label, badge } = tab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      </div>
    </nav>
  );
}

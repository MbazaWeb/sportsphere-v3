'use client';

import { useNavigationStore } from '@/store/navigationStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Activity, PlusCircle, Bell, User,
  type LucideIcon,
} from 'lucide-react';
import type { TabId } from '@/types';

interface TabConfig {
  id: TabId;
  label: string;
  Icon: LucideIcon;
  badge?: number;
}

const TABS: TabConfig[] = [
  { id: 'home',     label: 'Home',     Icon: Home },
  { id: 'scores',   label: 'Scores',   Icon: Activity },
  { id: 'create',   label: 'Create',   Icon: PlusCircle },
  { id: 'activity', label: 'Activity', Icon: Bell, badge: 3 },
  { id: 'profile',  label: 'Profile',  Icon: User },
];

function TabButton({ tab, isActive, onClick }: { tab: TabConfig; isActive: boolean; onClick: () => void }) {
  const { Icon, label, badge } = tab;
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex flex-col items-center justify-center gap-[3px] px-3 py-2 min-w-[56px] transition-colors duration-150',
        isActive ? 'text-sport-green' : 'text-muted-foreground',
      )}
    >
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="tab-indicator"
            className="absolute -top-px left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-sport-green"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
      </AnimatePresence>

      <div className="relative">
        <Icon
          className={cn('transition-all duration-150', isActive ? 'h-[22px] w-[22px] stroke-[2px]' : 'h-[22px] w-[22px] stroke-[1.5px]')}
          aria-hidden
        />
        {badge != null && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>

      <span className={cn('text-[10px] font-semibold tracking-wide transition-colors duration-150', isActive ? 'text-sport-green' : 'text-muted-foreground')}>
        {label}
      </span>
    </button>
  );
}

function CreateButton({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Create"
      aria-current={isActive ? 'page' : undefined}
      className="relative flex flex-col items-center justify-center gap-[3px] px-3 py-2 min-w-[56px]"
    >
      <div className={cn(
        'flex h-9 w-9 items-center justify-center rounded-[14px] transition-all duration-150',
        isActive ? 'bg-sport-green shadow-[0_0_12px_rgba(0,200,83,0.35)]' : 'bg-surface-elevated border border-surface-border',
      )}>
        <PlusCircle
          className={cn('h-[18px] w-[18px] transition-all duration-150', isActive ? 'stroke-black stroke-2' : 'stroke-muted-foreground stroke-[1.5px]')}
          aria-hidden
        />
      </div>
      <span className={cn('text-[10px] font-semibold tracking-wide transition-colors duration-150', isActive ? 'text-sport-green' : 'text-muted-foreground')}>
        Create
      </span>
    </button>
  );
}

export default function BottomNav() {
  const activeTab = useNavigationStore((s) => s.activeTab);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="border-t border-surface-border bg-background/88 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 pt-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            if (tab.id === 'create') return <CreateButton key={tab.id} isActive={isActive} onClick={() => setActiveTab(tab.id)} />;
            return <TabButton key={tab.id} tab={tab} isActive={isActive} onClick={() => setActiveTab(tab.id)} />;
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </nav>
  );
}

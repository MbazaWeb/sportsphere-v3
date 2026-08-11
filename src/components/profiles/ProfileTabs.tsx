'use client';

import { cn } from '@/lib/utils';

// Re-export the engine's getTabsForRole so callers can keep importing
// from this file (backward compat). The engine is the source of truth.
export { getTabsForRole } from '@/profile-engine/registry';

interface ProfileTabsProps {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function ProfileTabs({ tabs, activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="sticky top-0 z-30 mt-3 bg-background/95 backdrop-blur-xl border-b border-surface-border">
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)}
            className={cn('flex-shrink-0 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap',
              activeTab === tab.id ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

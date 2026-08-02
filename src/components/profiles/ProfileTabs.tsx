'use client';

import { cn } from '@/lib/utils';
import type { ProfileTab } from './profileConfig';

/**
 * Horizontal scrollable tab bar for profile type pages.
 * Each of the 17 profile types (Team, Player, Coach, etc.) has its own
 * set of tabs defined in profileConfig.ts. This component renders them
 * as a clean, scrollable pill bar.
 */
interface ProfileTabsProps {
  tabs: ProfileTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function ProfileTabs({ tabs, activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2 border-b border-surface-border">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-gold text-black'
                : 'bg-surface text-muted-foreground hover:text-white'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

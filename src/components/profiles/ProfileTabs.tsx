'use client';

import { cn } from '@/lib/utils';

export function getTabsForRole(role: string): Array<{ id: string; label: string }> {
  const feeds = [{ id: 'feeds', label: 'Feeds' }];
  switch (role) {
    case 'team':
      return [{ id: 'overview', label: 'Overview' }, ...feeds, { id: 'squad', label: 'Squad' }, { id: 'shop', label: 'Shop' }, { id: 'about', label: 'About' }];
    case 'business':
      return [{ id: 'overview', label: 'Overview' }, ...feeds, { id: 'shop', label: 'Shop' }, { id: 'about', label: 'About' }];
    case 'player':
      return [{ id: 'overview', label: 'Overview' }, ...feeds, { id: 'stats', label: 'Stats' }, { id: 'career', label: 'Career' }, { id: 'about', label: 'About' }];
    case 'coach':
      return [{ id: 'overview', label: 'Overview' }, ...feeds, { id: 'stats', label: 'Stats' }, { id: 'about', label: 'About' }];
    case 'analyst':
      return [{ id: 'overview', label: 'Overview' }, ...feeds, { id: 'tools', label: 'Tools' }, { id: 'about', label: 'About' }];
    case 'stadium': case 'venue':
      return [{ id: 'overview', label: 'Overview' }, ...feeds, { id: 'facilities', label: 'Facilities' }, { id: 'shop', label: 'Shop' }, { id: 'about', label: 'About' }];
    case 'journalist':
      return [{ id: 'overview', label: 'Overview' }, ...feeds, { id: 'articles', label: 'Articles' }, { id: 'about', label: 'About' }];
    case 'creator':
      return [{ id: 'overview', label: 'Overview' }, ...feeds, { id: 'spotlight', label: 'Spotlight' }, { id: 'about', label: 'About' }];
    default:
      return [...feeds, { id: 'spotlight', label: 'Spotlight' }, { id: 'about', label: 'About' }];
  }
}

interface ProfileTabsProps {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function ProfileTabs({ tabs, activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="sticky top-0 z-30 mt-4 bg-background/95 backdrop-blur-xl border-b border-surface-border">
      <div className="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)}
            className={cn('flex-shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition-colors',
              activeTab === tab.id ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

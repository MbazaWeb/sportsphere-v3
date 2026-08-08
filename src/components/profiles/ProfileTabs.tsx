'use client';

import { cn } from '@/lib/utils';

// Role-specific tab layout (LinkedIn-style).
// Each role gets tabs that make sense for what they do — Players get
// Stats & Career, Teams get Squad & Trophies, Businesses get Shop &
// Services, Sponsors get Portfolio, Competitions/Leagues get Standings
// & Fixtures, and so on. All roles keep Feeds + About as common ground.
export function getTabsForRole(role: string): Array<{ id: string; label: string }> {
  const feeds = [{ id: 'feeds', label: 'Feeds' }];
  const about = { id: 'about', label: 'About' };
  const overview = { id: 'overview', label: 'Overview' };

  switch (role) {
    // ── Athletes & Coaches ──────────────────────────────────────
    case 'player':
      return [overview, ...feeds, { id: 'stats', label: 'Stats' }, { id: 'career', label: 'Career' }, about];
    case 'coach':
      return [overview, ...feeds, { id: 'stats', label: 'Stats' }, { id: 'career', label: 'Career' }, about];
    case 'scout':
      return [overview, ...feeds, { id: 'reports', label: 'Reports' }, { id: 'career', label: 'Career' }, about];

    // ── Teams & Communities ─────────────────────────────────────
    case 'team':
      return [overview, ...feeds, { id: 'squad', label: 'Squad' }, { id: 'trophies', label: 'Trophies' }, { id: 'shop', label: 'Shop' }, about];
    case 'community':
      return [overview, ...feeds, { id: 'members', label: 'Members' }, about];

    // ── Organizations ───────────────────────────────────────────
    case 'organization':
      return [overview, ...feeds, { id: 'programs', label: 'Programs' }, about];
    case 'competition':
    case 'league':
      return [overview, ...feeds, { id: 'standings', label: 'Standings' }, { id: 'fixtures', label: 'Fixtures' }, { id: 'trophies', label: 'Trophies' }, about];
    case 'academy':
      return [overview, ...feeds, { id: 'squad', label: 'Squad' }, { id: 'programs', label: 'Programs' }, about];

    // ── Commercial ──────────────────────────────────────────────
    case 'business':
      return [overview, ...feeds, { id: 'shop', label: 'Shop' }, { id: 'services', label: 'Services' }, about];
    case 'commercial-partner':
      return [overview, ...feeds, { id: 'portfolio', label: 'Portfolio' }, { id: 'shop', label: 'Shop' }, about];

    // ── Venues ──────────────────────────────────────────────────
    case 'venue':
    case 'stadium':
      return [overview, ...feeds, { id: 'facilities', label: 'Facilities' }, { id: 'shop', label: 'Shop' }, about];

    // ── Media & Content ─────────────────────────────────────────
    case 'journalist':
      return [overview, ...feeds, { id: 'articles', label: 'Articles' }, { id: 'career', label: 'Career' }, about];
    case 'creator':
    case 'commentator':
      return [overview, ...feeds, { id: 'spotlight', label: 'Spotlight' }, { id: 'career', label: 'Career' }, about];

    // ── Analysts & Officials ────────────────────────────────────
    case 'analyst':
      return [overview, ...feeds, { id: 'tools', label: 'Tools' }, { id: 'articles', label: 'Articles' }, about];
    case 'official':
    case 'referee':
      return [overview, ...feeds, { id: 'career', label: 'Career' }, { id: 'stats', label: 'Stats' }, about];
    case 'support-staff':
    case 'medical':
      return [overview, ...feeds, { id: 'career', label: 'Career' }, about];

    // ── Agents ──────────────────────────────────────────────────
    case 'agent':
      return [overview, ...feeds, { id: 'clients', label: 'Clients' }, { id: 'career', label: 'Career' }, about];

    // ── Admin (low-key) ─────────────────────────────────────────
    case 'moderator':
    case 'administrator':
    case 'developer':
      return [overview, ...feeds, about];

    // ── Default (fan + unknown) ─────────────────────────────────
    default:
      return [...feeds, { id: 'spotlight', label: 'Spotlight' }, about];
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

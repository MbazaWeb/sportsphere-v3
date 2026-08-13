'use client';
import type { HomeSubTab } from '@/store/navigationStore';
import { Search, Bell, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { SearchModal } from './SearchModal';

const SUBTABS = [
  { id: 'for-you', label: 'Sportlights' },
  { id: 'trending', label: 'Trending' },
  { id: 'predictions', label: 'Predictions' },
  { id: 'polls', label: 'Polls' },
];

interface HomeHeaderProps {
  isSearchOpen: boolean;
  setIsSearchOpen: (val: boolean) => void;
}

export function HomeHeader({ isSearchOpen, setIsSearchOpen }: HomeHeaderProps) {
  const homeSubTab = useNavigationStore((s) => s.homeSubTab);
  const setHomeSubTab = useNavigationStore((s) => s.setHomeSubTab);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);

  return (
    <>
      {/* Search Modal */}
      <SearchModal open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <header className="sticky top-0 z-40 border-b border-surface-border/60 bg-background/80 backdrop-blur-2xl">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <button onClick={() => window.scrollTo(0, 0)} className="flex items-center gap-2">
            <img src="/logo.svg" alt="SportSphere" className="h-7 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/sportsphere/logo.svg"; }} />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/leaderboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface/80 hover:bg-surface-elevated transition-all duration-200"
              aria-label="Rankings"
              title="Rankings"
            >
              <Trophy className="h-[18px] w-[18px] text-amber-400" />
            </Link>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface/80 hover:bg-surface-elevated transition-all duration-200"
            >
              <Search className="h-[18px] w-[18px] text-muted-foreground" />
            </button>
            <button
              onClick={() => { if (!isAuthenticated) setLoginModalOpen(true); else setActiveTab('activity'); }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-surface/80 hover:bg-surface-elevated transition-all duration-200"
            >
              <Bell className="h-[18px] w-[18px] text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold ring-2 ring-background" />
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 px-4 pb-2.5">
          {SUBTABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setHomeSubTab(tab.id as HomeSubTab)}
              className={cn(
                'relative rounded-lg px-4 py-1.5 text-[13px] font-bold transition-all duration-200',
                homeSubTab === tab.id
                  ? 'bg-gold text-black shadow-sm shadow-gold/20'
                  : 'text-muted-foreground hover:text-foreground active:scale-95'
              )}
            >
              {tab.label}
              {homeSubTab === tab.id && (
                <div className="absolute inset-0 rounded-lg ring-1 ring-gold/30" />
              )}
            </button>
          ))}
        </div>
      </header>
    </>
  );
}
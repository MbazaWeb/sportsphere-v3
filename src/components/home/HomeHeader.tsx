'use client';
import type { HomeSubTab } from '@/store/navigationStore';
import { Search, Bell, Inbox, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { SearchModal } from './SearchModal';

const SUBTABS = [
  { id: 'for-you', label: 'Sportlights' },
  { id: 'trending', label: 'Trending' },
];

interface HomeHeaderProps {
  isSearchOpen: boolean;
  setIsSearchOpen: (val: boolean) => void;
  isCartOpen: boolean;
  setIsCartOpen: (val: boolean) => void;
}

export function HomeHeader({ isSearchOpen, setIsSearchOpen, isCartOpen, setIsCartOpen }: HomeHeaderProps) {
  const homeSubTab = useNavigationStore((s) => s.homeSubTab);
  const setHomeSubTab = useNavigationStore((s) => s.setHomeSubTab);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);

  return (
    <>
      {/* Upgraded Search Modal */}
      <SearchModal open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Cart Modal (unchanged) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setIsCartOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-surface-elevated p-6 border border-gold/30 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-xl font-bold text-gold">Your Cart</h2>
            <div className="mb-4 rounded-lg border border-surface-border bg-surface p-4 text-center">
              <p className="text-muted-foreground text-sm py-4">Your cart is empty.</p>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="w-full rounded-lg bg-surface py-2 hover:bg-surface-elevated transition-colors">Close</button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <button onClick={() => window.scrollTo(0, 0)} className="flex items-center">
            <img src="/logo-wordmark.svg" alt="SportSphere" style={{ height: '28px', width: 'auto' }} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
              <ShoppingBag className="h-4 w-4 text-gold" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-black">0</span>
            </button>
            <button onClick={() => { if (!isAuthenticated) setLoginModalOpen(true); else setActiveTab('activity'); }} className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
              <Inbox className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            </button>
            <button onClick={() => { if (!isAuthenticated) setLoginModalOpen(true); else setActiveTab('activity'); }} className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold animate-pulse" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          {SUBTABS.map((tab) => (
            <button key={tab.id} onClick={() => setHomeSubTab(tab.id as HomeSubTab)}
              className={cn('rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                homeSubTab === tab.id ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-foreground')}>
              {tab.label}
            </button>
          ))}
        </div>
      </header>
    </>
  );
}

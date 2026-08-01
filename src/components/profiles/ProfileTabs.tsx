'use client';

import { type ProfileTab } from './profileConfig';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

interface ProfileTabsProps {
  tabs: ProfileTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function ProfileTabs({ tabs, activeTab, onTabChange }: ProfileTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkFade = () => {
      setShowLeftFade(el.scrollLeft > 10);
      setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    checkFade();
    el.addEventListener('scroll', checkFade, { passive: true });
    window.addEventListener('resize', checkFade);
    return () => {
      el.removeEventListener('scroll', checkFade);
      window.removeEventListener('resize', checkFade);
    };
  }, []);

  // Auto-scroll to active tab
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector(`[data-tab="${activeTab}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  // Group tabs by category for visual separation
  const categoryOrder = ['overview', 'content', 'sports', 'community', 'commerce', 'about'] as const;

  return (
    <div className="relative border-b border-surface-border">
      {/* Left fade */}
      {showLeftFade && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
      )}

      <div
        ref={scrollRef}
        className="flex gap-0.5 overflow-x-auto scrollbar-hide px-4 py-2"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex-shrink-0 px-3 py-1.5"
            >
              <span className={cn(
                'text-sm font-medium transition-colors whitespace-nowrap',
                isActive ? 'text-sport-green' : 'text-muted-foreground hover:text-foreground'
              )}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="profileTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-sport-green"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right fade */}
      {showRightFade && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />
      )}
    </div>
  );
}

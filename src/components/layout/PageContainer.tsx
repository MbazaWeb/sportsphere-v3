'use client';

import { useAppStore } from '@/store/useAppStore';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = { type: 'tween', duration: 0.2 };

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function PageContainer({
  children,
  title,
  showBack,
  onBack,
  rightAction,
}: PageContainerProps) {
  const profileSection = useAppStore((s) => s.profileSection);
  const setProfileSection = useAppStore((s) => s.setProfileSection);
  const activeTab = useAppStore((s) => s.activeTab);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (profileSection !== 'main' && activeTab === 'profile') {
      setProfileSection('main');
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activeTab}-${profileSection}`}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="flex flex-col"
      >
        {/* Header */}
        {(title || showBack) && (
          <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
            <div className="flex h-14 max-w-lg items-center justify-between px-4">
              <div className="flex items-center gap-3">
                {showBack && (
                  <button
                    onClick={handleBack}
                    aria-label={title ? `Back from ${title}` : 'Go back'}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                {title && (
                  <div>
                    <h1 className="text-lg font-bold leading-tight">{title}</h1>
                  </div>
                )}
              </div>
              {rightAction && (
                <div className="flex items-center gap-2">
                  {rightAction}
                </div>
              )}
            </div>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 pb-20">
          {children}
        </main>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import { useEffect } from 'react';

export function MobileGestures({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Swipe navigation disabled to prevent accidental page navigation on mobile
    // Users can use the bottom nav bar instead
  }, []);

  return <>{children}</>;
}

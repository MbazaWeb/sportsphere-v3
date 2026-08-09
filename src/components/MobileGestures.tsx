'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function MobileGestures({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = endX - startX;
      const diffY = endY - startY;

      // Swipe Left to Go Back (Edge or horizontal swipe left)
      if (Math.abs(diffX) > 100 && Math.abs(diffY) < 50) {
        if (diffX > 0 && startX < 50) {
          // Swipe Right from Left Edge (Standard Native Back)
          router.back();
        } else if (diffX < -100) {
          // Explicit Swipe Left
          router.back();
        }
      }

      // Pull Down at top of page to Refresh
      if (window.scrollY === 0 && diffY > 150 && Math.abs(diffX) < 80) {
        window.location.reload();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router]);

  return <>{children}</>;
}

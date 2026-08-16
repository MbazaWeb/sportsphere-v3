'use client';

import { useEffect, useRef, useCallback } from 'react';

interface SwipeBackOptions {
  onBack: () => void;
  threshold?: number;   // px to trigger (default 200)
  edgeZone?: number;    // px from left edge to start (default 15)
  enabled?: boolean;
}

export function useSwipeBack({
  onBack,
  threshold = 200,
  edgeZone = 15,
  enabled = true,
}: SwipeBackOptions) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const swiping = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    // Only trigger from left edge zone
    if (x <= edgeZone) {
      startX.current = x;
      startY.current = y;
      swiping.current = true;
    }
  }, [enabled, edgeZone]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!swiping.current || startX.current === null || startY.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX.current;
    const dy = Math.abs(endY - startY.current);

    // Must be mostly horizontal swipe to the right
    if (dx > threshold && dy < 80) {
      onBack();
    }

    startX.current = null;
    startY.current = null;
    swiping.current = false;
  }, [onBack, threshold]);

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);
}

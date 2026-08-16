'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const THRESHOLD = 72;
const MAX_PULL = 110;

export default function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshing$ = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current;
    if (!el || refreshing$.current) return;
    if (el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || refreshing$.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      e.preventDefault();
      setPull(Math.min(dy * 0.55, MAX_PULL));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    setPull(prev => {
      if (prev >= THRESHOLD && !refreshing$.current) {
        refreshing$.current = true;
        setRefreshing(true);
        onRefresh().finally(() => {
          setRefreshing(false);
          refreshing$.current = false;
          setPull(0);
        });
        return THRESHOLD; // hold at threshold while refreshing
      }
      return 0;
    });
  }, [onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pull / THRESHOLD, 1);
  const indicatorY = refreshing ? THRESHOLD : pull;

  return (
    <div ref={containerRef} className={className} style={{ overflowY: 'auto', position: 'relative' }}>
      {/* Pull indicator */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: 0,
          zIndex: 50,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${indicatorY - 44}px)`,
          transition: refreshing ? 'transform 0.2s ease' : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}>
          {/* Circle indicator */}
          <div style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: 'rgba(11,14,20,0.95)',
            border: '2px solid rgba(255,196,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            {refreshing ? (
              <div style={{
                width: 16, height: 16,
                border: '2px solid rgba(255,196,0,0.2)',
                borderTop: '2px solid #ffc400',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            ) : (
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#ffc400" strokeWidth="2.5" strokeLinecap="round"
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                  opacity: progress,
                  transition: 'transform 0.1s ease',
                }}
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Content pushed down while pulling */}
      <div style={{
        transform: `translateY(${refreshing ? THRESHOLD * 0.5 : pull * 0.4}px)`,
        transition: refreshing || pull === 0 ? 'transform 0.25s ease' : 'none',
      }}>
        {children}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const splashRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 3600;
    const interval = 40;
    const steps = duration / interval;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      const pct = Math.round(100 * (1 - Math.pow(1 - current / steps, 2.5)));
      setProgress(Math.min(pct, 100));
      if (current >= steps) clearInterval(timer);
    }, interval);

    const t1 = setTimeout(() => {
      if (splashRef.current) {
        splashRef.current.style.opacity = '0';
        splashRef.current.style.pointerEvents = 'none';
      }
    }, 4000);
    const t2 = setTimeout(() => { onDone(); }, 4800);

    return () => { clearInterval(timer); clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/sportsphere';

  return (
    <div
      ref={splashRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        width: '100vw',
        height: '100dvh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        background: 'radial-gradient(circle at center, #0b1426 0%, #030812 100%)',
        transition: 'opacity 0.8s ease-out',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Stadium background */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: '100%', height: '40%',
        background: 'linear-gradient(to top, rgba(3,8,18,1) 0%, transparent 100%)',
        opacity: 0.5, zIndex: 1, pointerEvents: 'none',
      }} />

      {/* Giant watermark S */}
      <div style={{
        position: 'absolute', top: '15%',
        fontSize: '30vw', fontWeight: 900,
        color: '#ffc400', opacity: 0.05,
        zIndex: 1, fontStyle: 'italic',
        letterSpacing: '-20px', userSelect: 'none',
        lineHeight: 1,
      }}>S</div>

      <style>{`
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pctPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @supports not (height: 100dvh) {
          .splash-root { height: 100vh !important; }
        }
      `}</style>

      {/* Logo from public/ folder */}
      <div style={{
        zIndex: 10, width: '60%', maxWidth: 350,
        textAlign: 'center', marginBottom: '6vh',
        animation: 'logoFloat 3s ease-in-out infinite',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={basePath + '/logo.svg'}
          alt="SportSphere Logo"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Loading state */}
      <div style={{
        zIndex: 10, width: '82%', maxWidth: 320,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14,
      }}>
        {/* Spinner */}
        <div style={{
          width: 32, height: 32,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #ffc400',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 5,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ffc400 0%, #ffffff 100%)',
            borderRadius: 3,
            transition: 'width 0.04s linear',
            boxShadow: '0 0 8px rgba(255, 196, 0, 0.5)',
          }} />
        </div>

        {/* Percentage + label */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', width: '100%',
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.75rem', letterSpacing: '2px',
            textTransform: 'uppercase', fontWeight: 500,
          }}>Loading</div>
          <div style={{
            color: '#ffc400',
            fontSize: '1.05rem', fontWeight: 800,
            letterSpacing: '1px',
            fontVariantNumeric: 'tabular-nums',
            animation: progress < 100 ? 'pctPulse 1s ease-in-out infinite' : 'none',
            minWidth: 48, textAlign: 'right',
            textShadow: '0 0 12px rgba(255, 196, 0, 0.45)',
          }}>{progress}%</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 3vh)',
        left: 0, right: 0,
        zIndex: 10, textAlign: 'center', width: '100%',
        pointerEvents: 'none',
      }}>
        <div style={{
          color: 'white', fontSize: '1.2rem',
          letterSpacing: '4px', fontWeight: 600,
        }}>
          LIVE. <span style={{ color: '#ffc400' }}>PLAY.</span> CONNECT.
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '0.7rem', letterSpacing: '1px',
          marginTop: 10, fontWeight: 500,
        }}>
          &copy; {new Date().getFullYear()} MbazzaCodes Inc.
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const splashRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress from 0 → 100 over ~3.6s
    const duration = 3600;
    const interval = 40;
    const steps = duration / interval;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      // Ease-out curve — fast at start, slow near 100
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

  return (
    <div
      ref={splashRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        width: '100vw', height: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
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
        backgroundImage: `
          linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(3,8,18,0) 40%, rgba(3,8,18,1) 100%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 300'%3E%3Cpath d='M0 300 L0 180 Q150 100 300 140 Q450 180 600 120 Q750 60 900 100 Q1050 140 1200 80 L1200 300 Z' fill='%23334466' opacity='0.3'/%3E%3Cpath d='M0 300 L0 220 Q200 160 400 190 Q600 220 800 170 Q1000 120 1200 150 L1200 300 Z' fill='%23223355' opacity='0.25'/%3E%3Ccircle cx='200' cy='60' r='4' fill='%23ffffff' opacity='0.3'/%3E%3Ccircle cx='350' cy='40' r='3' fill='%23ffffff' opacity='0.2'/%3E%3Ccircle cx='500' cy='55' r='4' fill='%23ffffff' opacity='0.25'/%3E%3Ccircle cx='700' cy='35' r='3' fill='%23ffffff' opacity='0.2'/%3E%3Ccircle cx='900' cy='50' r='4' fill='%23ffffff' opacity='0.3'/%3E%3Ccircle cx='1050' cy='40' r='3' fill='%23ffffff' opacity='0.2'/%3E%3C/svg%3E")
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        opacity: 0.5,
        zIndex: 1,
        pointerEvents: 'none',
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

      {/* Keyframes */}
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
      `}</style>

      {/* Logo */}
      <div style={{
        zIndex: 10, width: '60%', maxWidth: 350,
        textAlign: 'center', marginBottom: '8vh',
        animation: 'logoFloat 3s ease-in-out infinite',
      }}>
        <img src="/sportsphere/logo.svg" alt="SportSphere Logo" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      {/* Loading state */}
      <div style={{
        zIndex: 10, width: '80%', maxWidth: 280,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 12,
      }}>
        {/* Spinner */}
        <div style={{
          width: 30, height: 30,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #ffc400',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 4,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ffc400 0%, #ffffff 100%)',
            borderRadius: 2,
            transition: 'width 0.04s linear',
          }} />
        </div>

        {/* Percentage + label */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', width: '100%',
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.7rem', letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>Loading...</div>
          <div style={{
            color: '#ffc400',
            fontSize: '0.85rem', fontWeight: 700,
            letterSpacing: '1px',
            animation: progress < 100 ? 'pctPulse 1s ease-in-out infinite' : 'none',
            minWidth: 36, textAlign: 'right',
          }}>{progress}%</div>
        </div>
      </div>

      {/* Footer — LIVE. PLAY. CONNECT. — no line below */}
      <div style={{
        position: 'absolute', bottom: '8vh',
        zIndex: 10, textAlign: 'center', width: '100%',
      }}>
        <div style={{
          color: 'white', fontSize: '1.2rem',
          letterSpacing: '4px', fontWeight: 600,
        }}>
          LIVE. <span style={{ color: '#ffc400' }}>PLAY.</span> CONNECT.
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.65rem', letterSpacing: '1px',
          marginTop: 8,
        }}>
          © {new Date().getFullYear()} MbazzaCodes Inc.
        </div>
      </div>
    </div>
  );
}

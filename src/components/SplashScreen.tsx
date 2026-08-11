'use client';

import { useEffect, useRef, useState } from 'react';

const LOADING_WORDS = [
  'Player', 'Sport', 'Game', 'Team',
  'Community', 'Competition', 'Content', 'Reputation', 'Opportunities',
];

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const splashRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [wordIndex, setWordIndex] = useState(-1);
  const [wordVisible, setWordVisible] = useState(false);
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'done'>('loading');

  useEffect(() => {
    const duration = 3200;
    const interval = 30;
    const steps = duration / interval;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      const pct = Math.round(100 * (1 - Math.pow(1 - current / steps, 3)));
      setProgress(Math.min(pct, 100));
      if (current >= steps) {
        clearInterval(timer);
        setPhase('reveal');
      }
    }, interval);

    const t1 = setTimeout(() => {
      if (splashRef.current) {
        splashRef.current.style.opacity = '0';
        splashRef.current.style.transform = 'scale(1.05)';
        splashRef.current.style.pointerEvents = 'none';
      }
    }, 3600);
    const t2 = setTimeout(() => { onDone(); }, 4200);

    return () => { clearInterval(timer); clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  useEffect(() => {
    const wordCount = LOADING_WORDS.length;
    const idx = Math.min(
      Math.floor((progress / 100) * wordCount),
      wordCount - 1
    );
    if (progress > 3 && idx !== wordIndex) {
      setWordVisible(false);
      setTimeout(() => {
        setWordIndex(idx);
        setWordVisible(true);
      }, 150);
    }
  }, [progress, wordIndex]);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/sportsphere';

  return (
    <div
      ref={splashRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        width: '100vw', height: '100dvh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        background: 'radial-gradient(ellipse at 50% 40%, #0f1d3a 0%, #0a1628 50%, #030812 100%)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @keyframes logoEnter {
          0% { opacity: 0; transform: scale(0.8) translateY(20px); }
          60% { transform: scale(1.02) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes barGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(245, 197, 24, 0.3); }
          50% { box-shadow: 0 0 16px rgba(245, 197, 24, 0.6), 0 0 32px rgba(245, 197, 24, 0.15); }
        }
        @keyframes wordGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(245, 197, 24, 0.2); }
          50% { text-shadow: 0 0 40px rgba(245, 197, 24, 0.5), 0 0 80px rgba(245, 197, 24, 0.15); }
        }
        @keyframes taglineFade {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 15px) scale(0.9); }
        }
        @supports not (height: 100dvh) {
          .splash-root { height: 100vh !important; }
        }
      `}</style>

      {/* Ambient gold orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'orbFloat1 8s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '5%',
        width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'orbFloat2 10s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Giant background S */}
      <div style={{
        position: 'absolute', top: '10%',
        fontSize: '35vw', fontWeight: 900,
        color: '#F5C518', opacity: 0.03,
        zIndex: 1, fontStyle: 'italic',
        letterSpacing: '-20px', userSelect: 'none', lineHeight: 1,
      }}>S</div>

      {/* Logo */}
      <div style={{
        zIndex: 10, width: '45%', maxWidth: 240,
        textAlign: 'center', marginBottom: '2.5vh',
        animation: 'logoEnter 0.8s ease-out forwards',
      }}>
        <img
          src={basePath + '/logo.svg'}
          alt="SportSphere Logo"
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
        />
      </div>

      {/* Animated Word */}
      <div style={{
        zIndex: 10, height: '10vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '3vh',
      }}>
        {wordIndex >= 0 && (
          <div style={{
            color: '#ffffff',
            fontSize: 'clamp(1.6rem, 5.5vw, 2.8rem)',
            fontWeight: 900,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            opacity: wordVisible ? 1 : 0,
            transform: wordVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            animation: wordVisible ? 'wordGlow 2s ease-in-out infinite' : 'none',
            textAlign: 'center',
          }}>
            {LOADING_WORDS[wordIndex]}
          </div>
        )}
      </div>

      {/* Progress section */}
      <div style={{
        zIndex: 10, width: '75%', maxWidth: 280,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 28, height: 28,
          border: '2.5px solid rgba(255,255,255,0.08)',
          borderTop: '2.5px solid #F5C518', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />

        <div style={{
          width: '100%', height: 4,
          backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #F5C518 0%, #FFD700 50%, #ffffff 100%)',
            backgroundSize: '200% 100%',
            borderRadius: 4,
            transition: 'width 0.03s linear',
            animation: 'shimmer 2s linear infinite, barGlow 1.5s ease-in-out infinite',
          }} />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '2px',
            textTransform: 'uppercase', fontWeight: 600,
          }}>Loading</div>
          <div style={{
            color: '#F5C518', fontSize: '0.95rem', fontWeight: 800, letterSpacing: '1px',
            fontVariantNumeric: 'tabular-nums',
            minWidth: 44, textAlign: 'right',
            textShadow: '0 0 12px rgba(245, 197, 24, 0.4)',
          }}>{progress}%</div>
        </div>
      </div>

      {/* Footer tagline */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 3vh)',
        left: 0, right: 0, zIndex: 10, textAlign: 'center', width: '100%',
        pointerEvents: 'none',
        animation: 'taglineFade 0.8s ease-out 0.5s both',
      }}>
        <div style={{
          color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', letterSpacing: '5px', fontWeight: 700,
        }}>
          LIVE. <span style={{ color: '#F5C518' }}>PLAY.</span> CONNECT.
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', letterSpacing: '1px', marginTop: 8, fontWeight: 500,
        }}>
          &copy; {new Date().getFullYear()} MbazzaCodes Inc.
        </div>
      </div>
    </div>
  );
}

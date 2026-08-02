'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [showTagline, setShowTagline] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 2.5, 100));
    }, 35);
    const t1 = setTimeout(() => setShowTagline(true), 900);
    const t2 = setTimeout(() => setExiting(true), 2200);
    const t3 = setTimeout(() => onDone(), 2600);
    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backgroundColor: '#0A1628' }}
    >
      {/* Subtle glow behind logo */}
      <div
        className="absolute rounded-full"
        style={{
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
        }}
      />

      {/* Speed lines top-left */}
      <div className="absolute top-0 left-0 pointer-events-none" style={{ opacity: 0.2 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
          <line x1="0" y1="160" x2="200" y2="0" stroke="#F5C518" strokeWidth="2"/>
          <line x1="0" y1="200" x2="160" y2="0" stroke="#F5C518" strokeWidth="1"/>
          <line x1="0" y1="120" x2="180" y2="0" stroke="#F5C518" strokeWidth="0.5"/>
        </svg>
      </div>

      {/* Speed lines bottom-right */}
      <div className="absolute bottom-0 right-0 pointer-events-none" style={{ opacity: 0.2, transform: 'rotate(180deg)' }}>
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
          <line x1="0" y1="160" x2="200" y2="0" stroke="#F5C518" strokeWidth="2"/>
          <line x1="0" y1="200" x2="160" y2="0" stroke="#F5C518" strokeWidth="1"/>
        </svg>
      </div>

      {/* Logo + wordmark */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center gap-8 relative z-10"
      >
        {/* S mark — smooth italic style matching logo */}
        <svg viewBox="0 0 100 130" width="90" height="117" fill="none">
          {/* Top horizontal bar */}
          <path d="M15 8 L78 8 Q88 8 88 18 L88 18 Q88 28 78 28 L42 28 L42 55 L15 55 Q5 55 5 45 L5 18 Q5 8 15 8 Z" fill="#F5C518"/>
          {/* Bottom horizontal bar */}
          <path d="M22 75 L58 75 L58 102 Q58 112 68 112 L85 112 Q95 112 95 122 L95 122 Q95 122 85 122 L22 122 Q12 122 12 112 L12 85 Q12 75 22 75 Z" fill="#F5C518"/>
          {/* Middle connector — diagonal italic feel */}
          <path d="M42 55 L58 55 L58 75 L42 75 Z" fill="#F5C518"/>
          {/* Top-left italic slash */}
          <path d="M5 8 L22 8 L5 28 Z" fill="#0A1628"/>
          {/* Bottom-right italic slash */}
          <path d="M95 102 L78 122 L95 122 Z" fill="#0A1628"/>
        </svg>

        {/* Wordmark */}
        <div className="flex items-baseline">
          <span style={{
            fontSize: 38, fontWeight: 900, fontStyle: 'italic',
            color: '#FFFFFF', letterSpacing: '-0.5px', lineHeight: 1,
          }}>Sport</span>
          <span style={{
            fontSize: 38, fontWeight: 900, fontStyle: 'italic',
            color: '#F5C518', letterSpacing: '-0.5px', lineHeight: 1,
          }}>Sphere</span>
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: showTagline ? 1 : 0, y: showTagline ? 0 : 10 }}
        transition={{ duration: 0.5 }}
        className="absolute flex items-center gap-3 z-10"
        style={{ bottom: 120 }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)' }}>LIVE.</span>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.25em', color: '#F5C518' }}>PLAY.</span>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)' }}>CONNECT.</span>
      </motion.div>

      {/* Progress bar */}
      <div
        className="absolute z-10"
        style={{ bottom: 72, left: 40, right: 40 }}
      >
        <div style={{ height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #F5C518, #FFD700)',
            width: `${progress}%`,
            transition: 'width 0.05s linear',
          }} />
        </div>
      </div>
    </motion.div>
  );
}

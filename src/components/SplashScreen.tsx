'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [showTagline, setShowTagline] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setProgress(p => Math.min(p + 2.5, 100)), 35);
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
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#0A1628',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Speed lines top-left */}
      <div style={{ position: 'absolute', top: 0, left: 0, opacity: 0.18, pointerEvents: 'none' }}>
        <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
          <line x1="0" y1="180" x2="220" y2="0" stroke="#F5C518" strokeWidth="2.5"/>
          <line x1="0" y1="220" x2="180" y2="0" stroke="#F5C518" strokeWidth="1.2"/>
          <line x1="0" y1="140" x2="200" y2="0" stroke="#F5C518" strokeWidth="0.6"/>
        </svg>
      </div>

      {/* Speed lines bottom-right */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.18, pointerEvents: 'none', transform: 'rotate(180deg)' }}>
        <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
          <line x1="0" y1="180" x2="220" y2="0" stroke="#F5C518" strokeWidth="2.5"/>
          <line x1="0" y1="220" x2="180" y2="0" stroke="#F5C518" strokeWidth="1.2"/>
        </svg>
      </div>

      {/* Glow behind logo */}
      <div style={{
        position: 'absolute', width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.07) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -58%)',
        pointerEvents: 'none',
      }} />

      {/* Logo group */}
      <motion.div
        initial={{ scale: 0.55, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative', zIndex: 1 }}
      >
        {/* S mark using SVG file */}
        <Image src="/logo.svg" alt="SportSphere" width={160} height={192} priority />

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span style={{ fontSize: 40, fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', letterSpacing: '-0.5px', lineHeight: 1 }}>Sport</span>
          <span style={{ fontSize: 40, fontWeight: 900, fontStyle: 'italic', color: '#F5C518', letterSpacing: '-0.5px', lineHeight: 1 }}>Sphere</span>
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: showTagline ? 1 : 0, y: showTagline ? 0 : 10 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'absolute', bottom: 110, display: 'flex', alignItems: 'center', gap: 12, zIndex: 1 }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.45)' }}>LIVE.</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.28em', color: '#F5C518' }}>PLAY.</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.45)' }}>CONNECT.</span>
      </motion.div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 64, left: 40, right: 40, zIndex: 1 }}>
        <div style={{ height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #F5C518, #FFD700)',
            width: `${progress}%`, transition: 'width 0.05s linear',
          }} />
        </div>
      </div>
    </motion.div>
  );
}

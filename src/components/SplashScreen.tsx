'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [showTagline, setShowTagline] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setProgress(p => Math.min(p + 2.2, 100)), 35);
    const t1 = setTimeout(() => setShowTagline(true), 800);
    const t2 = setTimeout(() => setExiting(true), 2300);
    const t3 = setTimeout(() => onDone(), 2700);
    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        background: 'radial-gradient(circle at center, #0b1426 0%, #030812 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Giant faint watermark S — exactly as spec */}
      <div style={{
        position: 'absolute',
        top: '10%',
        fontSize: '60vw',
        fontWeight: 900,
        fontStyle: 'italic',
        color: '#ffc400',
        opacity: 0.04,
        zIndex: 1,
        letterSpacing: '-20px',
        userSelect: 'none',
        lineHeight: 1,
      }}>S</div>

      {/* Stadium silhouette at bottom — exactly as spec */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: '100%', height: '40%',
        background: `
          linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(3,8,18,0) 40%, rgba(3,8,18,1) 100%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0 200 L0 120 Q50 80 100 100 Q150 120 200 90 Q250 60 300 80 Q350 100 400 70 Q450 40 500 60 Q550 80 600 50 Q650 20 700 40 Q750 60 800 30 L800 200 Z' fill='%23ffffff' opacity='0.06'/%3E%3Cpath d='M0 200 L0 150 Q100 110 200 130 Q300 150 400 120 Q500 90 600 110 Q700 130 800 100 L800 200 Z' fill='%23ffffff' opacity='0.04'/%3E%3C/svg%3E")
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Speed lines top-left */}
      <div style={{ position: 'absolute', top: 0, left: 0, opacity: 0.15, zIndex: 2, pointerEvents: 'none' }}>
        <svg width="250" height="250" viewBox="0 0 250 250" fill="none">
          <line x1="0" y1="200" x2="250" y2="0" stroke="#F5C518" strokeWidth="3"/>
          <line x1="0" y1="250" x2="200" y2="0" stroke="#F5C518" strokeWidth="1.5"/>
          <line x1="0" y1="150" x2="220" y2="0" stroke="#F5C518" strokeWidth="0.7"/>
        </svg>
      </div>

      {/* Speed lines bottom-right */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.15, zIndex: 2, pointerEvents: 'none', transform: 'rotate(180deg)' }}>
        <svg width="250" height="250" viewBox="0 0 250 250" fill="none">
          <line x1="0" y1="200" x2="250" y2="0" stroke="#F5C518" strokeWidth="3"/>
          <line x1="0" y1="250" x2="200" y2="0" stroke="#F5C518" strokeWidth="1.5"/>
        </svg>
      </div>

      {/* Main logo — centered, 60% width max 400px exactly as spec */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          zIndex: 10,
          width: '60%',
          maxWidth: 400,
          textAlign: 'center',
          marginBottom: '5vh',
        }}
      >
        <img src="/logo.svg" alt="SportSphere Logo" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </motion.div>

      {/* Footer section — exactly as spec */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: showTagline ? 1 : 0, y: showTagline ? 0 : 16 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          bottom: '8vh',
          zIndex: 10,
          textAlign: 'center',
          width: '100%',
        }}
      >
        {/* LIVE. PLAY. CONNECT. */}
        <div style={{
          color: 'white',
          fontSize: '1.1rem',
          letterSpacing: '4px',
          fontWeight: 700,
          marginBottom: 14,
        }}>
          LIVE. <span style={{ color: '#ffc400' }}>PLAY.</span> CONNECT.
        </div>

        {/* Gradient bar: yellow → white → yellow exactly as spec */}
        <div style={{
          width: '50%',
          maxWidth: 300,
          height: 4,
          margin: '0 auto',
          borderRadius: 2,
          background: 'linear-gradient(90deg, #ffc400 0%, #ffffff 50%, #ffc400 100%)',
        }} />
      </motion.div>
    </motion.div>
  );
}

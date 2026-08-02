'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'done'>('logo');

  useEffect(() => {
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 2;
      });
    }, 30);

    // Phase transitions
    const t1 = setTimeout(() => setPhase('tagline'), 800);
    const t2 = setTimeout(() => setPhase('done'), 2200);
    const t3 = setTimeout(() => onDone(), 2600);

    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at top, #0F1D3A, #0A1628)' }}
        >
          {/* Decorative glow rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-[500px] w-[500px] rounded-full border border-white/5 absolute" />
            <div className="h-[350px] w-[350px] rounded-full border border-white/5 absolute" />
            <div className="h-[200px] w-[200px] rounded-full bg-[#F5C518]/5 blur-3xl absolute" />
          </div>

          {/* Diagonal speed lines — top-left */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
            <line x1="-50" y1="200" x2="350" y2="-100" stroke="#F5C518" strokeWidth="2"/>
            <line x1="-50" y1="280" x2="300" y2="-50" stroke="#F5C518" strokeWidth="1"/>
          </svg>
          {/* Diagonal speed lines — bottom-right */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
            <line x1="110%" y1="60%" x2="60%" y2="110%" stroke="#F5C518" strokeWidth="2"/>
            <line x1="110%" y1="55%" x2="65%" y2="110%" stroke="#F5C518" strokeWidth="1"/>
          </svg>

          {/* Logo group */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center gap-6 relative z-10"
          >
            {/* S logo mark */}
            <div className="relative">
              {/* Outer glow disc */}
              <div className="absolute inset-[-20px] rounded-[40px] bg-[#F5C518]/10 blur-xl" />
              <div className="relative flex h-36 w-36 items-center justify-center rounded-[32px] bg-[#0F1D3A] border border-white/10"
                style={{ boxShadow: '0 0 60px rgba(245,197,24,0.15)' }}>
                {/* The S lettermark — matches logo */}
                <svg viewBox="0 0 80 80" width="88" height="88" fill="none">
                  {/* Top bar of S */}
                  <path d="M20 16 L56 16 L64 24 L42 24 L42 36 L20 36 L12 28 Z" fill="#F5C518"/>
                  {/* Middle connector */}
                  <path d="M20 36 L42 36 L42 44 L20 44 Z" fill="#F5C518" opacity="0.9"/>
                  {/* Bottom bar of S */}
                  <path d="M38 44 L60 44 L68 52 L38 52 L38 64 L16 64 L24 56 L38 56 Z" fill="#F5C518"/>
                  {/* Notch/cutout for speed effect */}
                  <path d="M20 16 L28 16 L20 24 Z" fill="#0A1628" opacity="0.6"/>
                  <path d="M52 56 L60 56 L52 64 Z" fill="#0A1628" opacity="0.6"/>
                </svg>
              </div>
            </div>

            {/* Wordmark */}
            <div className="flex items-baseline gap-0">
              <span className="text-4xl font-black tracking-tight text-white" style={{ fontStyle: 'italic' }}>
                Sport
              </span>
              <span className="text-4xl font-black tracking-tight" style={{ color: '#F5C518', fontStyle: 'italic' }}>
                Sphere
              </span>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: phase === 'tagline' ? 1 : 0, y: phase === 'tagline' ? 0 : 12 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-32 flex items-center gap-2 z-10"
          >
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Live.</span>
            <span className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: '#F5C518' }}>Play.</span>
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Connect.</span>
          </motion.div>

          {/* Progress bar */}
          <div className="absolute bottom-16 left-8 right-8 z-10">
            <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #F5C518, #FFD700)', width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

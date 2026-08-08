'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  label?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  labelClassName?: string;
}

export default function AnimatedCounter({
  value,
  label,
  prefix = '',
  suffix = '',
  duration = 2,
  className = '',
  labelClassName = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: 'easeOut' },
          },
        }}
        className="text-center"
      >
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
          className="text-2xl font-black text-gold"
        >
          {prefix}
          {value}
          {suffix}
        </motion.span>
        {label && (
          <p className={cn('text-xs text-muted-foreground mt-1', labelClassName)}>
            {label}
          </p>
        )}
      </motion.div>
    </div>
  );
}
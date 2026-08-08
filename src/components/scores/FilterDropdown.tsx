'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  icon: Icon,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={cn(
          'flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[10px] sm:px-3 sm:py-2 sm:text-xs font-semibold transition-colors border flex-shrink',
          value !== 'All'
            ? 'bg-gold/10 border-gold/30 text-gold'
            : 'bg-surface border-surface-border text-muted-foreground hover:text-foreground'
        )}
      >
        <Icon className="h-3 w-3" />
        {value === 'All' ? label : value.length > 10 ? value.slice(0, 10) + '…' : value}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 999 }}
              className="min-w-[160px] max-h-[60vh] overflow-y-auto rounded-xl bg-surface-elevated border border-surface-border shadow-2xl"
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center px-4 py-2.5 text-xs font-medium transition-colors hover:bg-surface text-left',
                    opt === value ? 'text-gold' : 'text-foreground'
                  )}
                >
                  {opt === value && (
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-gold flex-shrink-0" />
                  )}
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

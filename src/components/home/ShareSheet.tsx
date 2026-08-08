'use client';

import { motion } from 'framer-motion';

export function ShareSheet({ onClose }: { onClose: () => void }) {
  const options = ['Copy Link', 'Share to Story', 'Send as Message', 'Twitter/X', 'WhatsApp'];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        exit={{ y: 200 }}
        transition={{ type: 'spring', damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl bg-surface-elevated border-t border-surface-border p-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface-border" />
        <h3 className="mb-4 text-sm font-bold text-white">Share</h3>
        <div className="flex flex-col gap-1">
          {options.map((opt) => (
            <button key={opt} onClick={onClose}
              className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-white hover:bg-surface transition-colors text-left">
              {opt}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 w-full rounded-xl bg-surface py-3 text-sm font-semibold text-muted-foreground">Cancel</button>
      </motion.div>
    </div>
  );
}

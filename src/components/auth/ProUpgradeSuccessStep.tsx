'use client';

import { ShieldCheck } from 'lucide-react';

interface ProUpgradeSuccessStepProps {
  onClose: () => void;
}

export function ProUpgradeSuccessStep({ onClose }: ProUpgradeSuccessStepProps) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold shadow-[0_4px_30px_rgba(245,197,24,0.3)]">
        <ShieldCheck className="h-10 w-10 text-black" strokeWidth={3} />
      </div>
      <h2 className="mb-2 text-2xl font-black text-gold-gradient">Upgrade Submitted!</h2>
      <p className="mb-6 text-sm text-muted-foreground max-w-xs">
        Your role upgrade is under admin review. You&apos;ll receive a notification once it&apos;s approved.
      </p>
      <button onClick={onClose} className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors shadow-[0_4px_20px_rgba(245,197,24,0.2)]">
        Continue
      </button>
    </div>
  );
}

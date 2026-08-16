'use client';

import { Check, ShieldCheck } from 'lucide-react';

interface RegistrationSuccessStepProps {
  name: string;
  isPending?: boolean;
  roleName?: string;
  onClose: () => void;
}

export function RegistrationSuccessStep({ name, isPending, roleName, onClose }: RegistrationSuccessStepProps) {
  if (isPending) {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface border-2 border-gold shadow-[0_4px_30px_rgba(245,197,24,0.15)]">
          <ShieldCheck className="h-10 w-10 text-gold" strokeWidth={3} />
        </div>
        <h2 className="mb-2 text-2xl font-black text-gold-gradient">Welcome{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
        <p className="mb-2 text-sm text-muted-foreground max-w-xs">
          Your {roleName || 'PRO'} account is created and pending admin verification.
        </p>
        <div className="mb-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 max-w-xs">
          <p className="text-xs text-yellow-400 font-semibold">Pending Verification</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Our team will review your profile within 1-3 business days. You'll get a verified badge once approved.
          </p>
        </div>
        <p className="mb-6 text-xs text-muted-foreground/70 max-w-xs">
          You can explore SportSphere in the meantime. Your PRO features will activate once verified.
        </p>
        <button onClick={onClose} className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors shadow-[0_4px_20px_rgba(245,197,24,0.2)]">
          Explore SportSphere
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold shadow-[0_4px_30px_rgba(245,197,24,0.3)]">
        <Check className="h-10 w-10 text-black" strokeWidth={3} />
      </div>
      <h2 className="mb-2 text-2xl font-black text-gold-gradient">Welcome{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
      <p className="mb-2 text-sm text-muted-foreground max-w-xs">
        Your account is ready. Start following teams, players, and communities.
      </p>
      <p className="mb-8 text-xs text-muted-foreground/70 max-w-xs">
        You can upgrade to PRO roles from your profile settings anytime.
      </p>
      <button onClick={onClose} className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors shadow-[0_4px_20px_rgba(245,197,24,0.2)]">
        Explore SportSphere
      </button>
    </div>
  );
}

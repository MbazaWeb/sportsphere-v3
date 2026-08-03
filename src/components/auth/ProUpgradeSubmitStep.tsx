'use client';

import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleType { id: string; name: string; slug: string; description: string | null; }
interface Role { id: string; name: string; slug: string; icon: string; description: string; category: string; types: RoleType[]; }

interface ProUpgradeSubmitStepProps {
  role: Role;
  roleType: RoleType;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function ProUpgradeSubmitStep({ role, roleType, onBack, onSubmit, submitting }: ProUpgradeSubmitStepProps) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-black text-white">Confirm Upgrade</h2>
          <p className="text-xs text-muted-foreground">Review and submit</p>
        </div>
      </div>
      <div className="mb-4 rounded-xl bg-gold/10 border border-gold/20 p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{role.icon}</span>
          <div>
            <p className="text-base font-bold text-white">{role.name}</p>
            <p className="text-sm text-gold">{roleType.name}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
      </div>
      <div className="mb-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-yellow-400" />
          <p className="text-xs font-semibold text-yellow-400">Verification Required</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Your profile will be reviewed by our admin team within 1-3 business days. Once approved, you&apos;ll receive a verified badge.
        </p>
      </div>
      <button
        onClick={onSubmit}
        disabled={submitting}
        className={cn(
          'w-full rounded-xl py-3 text-sm font-bold transition-colors',
          submitting
            ? 'bg-surface border border-surface-border text-muted-foreground cursor-not-allowed'
            : 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]'
        )}
      >
        <ShieldCheck className="mr-2 inline h-4 w-4" />
        {submitting ? 'Submitting…' : 'Submit for Verification'}
      </button>
    </div>
  );
}

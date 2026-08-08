'use client';

import { Check } from 'lucide-react';

interface RegistrationSuccessStepProps {
  name: string;
  onClose: () => void;
}

export function RegistrationSuccessStep({ name, onClose }: RegistrationSuccessStepProps) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold shadow-[0_4px_30px_rgba(245,197,24,0.3)]">
        <Check className="h-10 w-10 text-black" strokeWidth={3} />
      </div>
      <h2 className="mb-2 text-2xl font-black text-gold-gradient">Welcome{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
      <p className="mb-2 text-sm text-muted-foreground max-w-xs">
        Your fan account is ready. Start following teams, players, and communities.
      </p>
      <p className="mb-8 text-xs text-muted-foreground/70 max-w-xs">
        You can upgrade to Player, Coach, Scout, or other roles from your profile later.
      </p>
      <button onClick={onClose} className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors shadow-[0_4px_20px_rgba(245,197,24,0.2)]">
        Explore SportSphere
      </button>
    </div>
  );
}

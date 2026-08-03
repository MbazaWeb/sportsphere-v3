'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RoleType { id: string; name: string; slug: string; description: string | null; }
interface Role { id: string; name: string; slug: string; icon: string; description: string; category: string; types: RoleType[]; }

interface ProUpgradeTypeStepProps {
  role: Role;
  onSelect: (type: RoleType) => void;
  onBack: () => void;
}

export function ProUpgradeTypeStep({ role, onSelect, onBack }: ProUpgradeTypeStepProps) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-black text-white">{role.icon} {role.name}</h2>
          <p className="text-xs text-muted-foreground">Choose your type</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {role.types.map(type => (
          <button
            key={type.id}
            onClick={() => onSelect(type)}
            className="flex items-center justify-between glass-card rounded-xl px-4 py-3 text-left transition-colors hover:border-gold/30 glass-card-hover"
          >
            <div>
              <p className="text-sm font-bold text-white">{type.name}</p>
              {type.description && (
                <p className="text-xs text-muted-foreground">{type.description}</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { X, ChevronRight } from 'lucide-react';

interface RoleType { id: string; name: string; slug: string; description: string | null; }
interface Role { id: string; name: string; slug: string; icon: string; description: string; category: string; types: RoleType[]; }

interface ProUpgradeRoleStepProps {
  roles: Role[];
  onSelect: (role: Role) => void;
  onClose: () => void;
}

export function ProUpgradeRoleStep({ roles, onSelect, onClose }: ProUpgradeRoleStepProps) {
  const categories: Record<string, Role[]> = {};
  for (const role of roles) {
    if (role.slug === 'fan') continue;
    const cat = role.category;
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(role);
  }
  const categoryLabels: Record<string, string> = {
    individual: 'Individuals', team_entity: 'Teams & Entities', organization: 'Organizations',
    commercial: 'Commercial', official: 'Officials', support: 'Support Staff', admin: 'Administration',
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-black text-gold-gradient">Upgrade to PRO</h2>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Choose your professional role. Verified profiles get a badge and exclusive features.</p>
      <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto scrollbar-hide pr-1">
        {Object.entries(categories).map(([cat, catRoles]) => (
          <div key={cat}>
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {categoryLabels[cat] || cat}
            </p>
            <div className="flex flex-col gap-2">
              {catRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => onSelect(role)}
                  className="flex items-center gap-3 glass-card rounded-xl px-4 py-3 text-left transition-colors hover:border-gold/30 glass-card-hover"
                >
                  <span className="text-2xl">{role.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{role.name}</p>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

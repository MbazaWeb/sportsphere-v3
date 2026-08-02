'use client';
import { cn } from '@/lib/utils';
import {
  Star, Users, Briefcase, Building, Trophy, Scale, Newspaper,
  BarChart3, Camera, Search, ShieldCheck, Award, Mic, Flag,
  Heart, Stethoscope, Gavel, Cpu, Monitor, Crown,
} from 'lucide-react';

interface RoleBadgeProps {
  role: string;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

// Spec: Phase 10 — "Use ALL 20 Roles. Every role must have a Profile badge."
const ROLE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  fan:          { icon: Star,       label: 'Fan',          color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  player:       { icon: Star,       label: 'Player',       color: 'bg-gold/15 text-gold border-gold/30' },
  coach:        { icon: Users,      label: 'Coach',        color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  scout:        { icon: Search,     label: 'Scout',        color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  journalist:   { icon: Newspaper,  label: 'Journalist',   color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  creator:      { icon: Camera,     label: 'Creator',      color: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
  analyst:      { icon: BarChart3,  label: 'Analyst',      color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  agent:        { icon: Briefcase,  label: 'Agent',        color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  official:     { icon: Gavel,      label: 'Official',     color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  medical:      { icon: Stethoscope,label: 'Medical',      color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  team:         { icon: Users,      label: 'Team',         color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  academy:      { icon: ShieldCheck,label: 'Academy',      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  organization: { icon: Building,   label: 'Organization', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  competition:  { icon: Trophy,     label: 'Competition',  color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  business:     { icon: Briefcase,  label: 'Business',     color: 'bg-gray-500/15 text-gray-300 border-gray-500/30' },
  venue:        { icon: Building,   label: 'Venue',        color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  media:        { icon: Monitor,    label: 'Media',        color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  moderator:    { icon: ShieldCheck,label: 'Moderator',    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  administrator:{ icon: Crown,      label: 'Admin',        color: 'bg-gold/15 text-gold border-gold/30' },
  developer:    { icon: Cpu,        label: 'Developer',    color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  // Legacy slug compatibility
  referee:      { icon: Gavel,      label: 'Official',     color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  community:    { icon: Users,      label: 'Community',    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  stadium:      { icon: Building,   label: 'Venue',        color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  match:        { icon: Flag,       label: 'Match',        color: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

/**
 * RoleBadge — shows a colored pill with the role's icon and label.
 * Spec: Phase 6 — "Profile must always display Role badge. Type badge."
 */
export function RoleBadge({ role, size = 'sm', showLabel = true, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-0.5',
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1',
  };
  const iconSizes = { xs: 'h-2.5 w-2.5', sm: 'h-3 w-3', md: 'h-3.5 w-3.5' };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold uppercase tracking-wider',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && config.label}
    </span>
  );
}

/**
 * TypeBadge — shows the user's role type (e.g., "Professional", "Casual Fan").
 * Spec: Phase 6 — "Type badge must always be displayed."
 */
export function TypeBadge({ typeName, size = 'sm', className }: {
  typeName: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  if (!typeName) return null;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-0.5',
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium bg-surface/50 text-muted-foreground border-surface-border',
        sizeClasses[size],
        className
      )}
    >
      {typeName}
    </span>
  );
}

/**
 * VerifiedBadge — gold checkmark. Shown separately from the role badge.
 */
export function VerifiedBadge({ size = 'sm', className }: { size?: 'xs' | 'sm' | 'md'; className?: string }) {
  const iconSizes = { xs: 'h-2.5 w-2.5', sm: 'h-3 w-3', md: 'h-3.5 w-3.5' };
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-0.5',
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold bg-gold/15 text-gold border-gold/30',
        sizeClasses[size],
        className
      )}
    >
      <ShieldCheck className={iconSizes[size]} />
      <span className="uppercase tracking-wider">Verified</span>
    </span>
  );
}

/**
 * BadgeStack — renders verified + role + type badges together.
 * Spec: Phase 6 — "Profile must always display Role badge, Type badge."
 */
export function BadgeStack({ role, isVerified, typeName, size = 'sm' }: {
  role: string;
  isVerified?: boolean;
  typeName?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {isVerified && <VerifiedBadge size={size} />}
      <RoleBadge role={role} size={size} />
      {typeName && <TypeBadge typeName={typeName} size={size} />}
    </div>
  );
}

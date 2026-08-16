'use client';

// ─── Shared UI primitives for Profile Engine tabs ──────────────
//
// These are the building blocks per-role tabs compose from. They give
// every role's tab a consistent look (glass card, gold accents, dark
// theme) while letting each tab's LAYOUT be genuinely different.
//
// Per-role tabs import these — they don't reach into @/components/ui
// directly, so we can swap the visual language in one place if needed.

import type { ReactNode, ElementType } from 'react';
import { cn } from '@/lib/utils';
import { TYPED_PROFILE_ROLES } from '@/lib/typed-profiles';

// ─── Card ──────────────────────────────────────────────────────
export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn('glass-card rounded-2xl p-4', hover && 'glass-card-hover', className)}>
      {children}
    </div>
  );
}

// ─── Section heading ───────────────────────────────────────────
export function SectionTitle({
  icon: Icon,
  children,
  action,
}: {
  icon?: ElementType;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </h3>
      {action}
    </div>
  );
}

// ─── Stat tile ─────────────────────────────────────────────────
// A single metric in a grid. Icon + label + value.
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'gold',
}: {
  icon?: ElementType;
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'gold' | 'green' | 'red' | 'blue' | 'muted';
}) {
  const accentClass =
    accent === 'green' ? 'text-emerald-400'
    : accent === 'red' ? 'text-red-400'
    : accent === 'blue' ? 'text-blue-400'
    : accent === 'muted' ? 'text-muted-foreground'
    : 'text-gold';
  return (
    <div className="rounded-xl bg-surface p-3 border border-surface-border/50">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className={cn('h-3 w-3', accentClass)} />}
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{label}</p>
      </div>
      <p className="text-base font-bold text-white break-words">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── Stat grid ─────────────────────────────────────────────────
export function StatGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const colClass = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3';
  return <div className={cn('grid gap-2', colClass)}>{children}</div>;
}

// ─── Key-value row ─────────────────────────────────────────────
// For "Identity" cards with label-on-left, value-on-right rows.
export function KeyValueRow({ label, value }: { label: string; value: ReactNode }) {
  const display = value === null || value === undefined || value === '' ? '—' : value;
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-surface-border/40 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-white text-right">{display}</span>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: ElementType;
  title: string;
  message?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Icon className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm font-semibold text-white">{title}</p>
        {message && <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-xs">{message}</p>}
      </div>
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────
export function Badge({
  children,
  color = 'gold',
  className,
}: {
  children: ReactNode;
  color?: 'gold' | 'green' | 'red' | 'blue' | 'muted';
  className?: string;
}) {
  const colorClass =
    color === 'green' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : color === 'red' ? 'bg-red-500/15 text-red-400 border-red-500/30'
    : color === 'blue' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    : color === 'muted' ? 'bg-surface text-muted-foreground border-surface-border'
    : 'bg-gold/15 text-gold border-gold/30';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', colorClass, className)}>
      {children}
    </span>
  );
}

// ─── Timeline item ─────────────────────────────────────────────
// For career timelines. Year on the left, content on the right.
export function TimelineItem({
  year,
  title,
  subtitle,
  icon: Icon,
}: {
  year: string;
  title: string;
  subtitle?: string;
  icon?: ElementType;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 border border-gold/30 flex-shrink-0">
          {Icon ? <Icon className="h-3.5 w-3.5 text-gold" /> : <span className="h-2 w-2 rounded-full bg-gold" />}
        </div>
        <div className="w-px flex-1 bg-surface-border" />
      </div>
      <div className="flex-1 pb-4">
        <p className="text-[10px] text-gold font-bold uppercase tracking-wider">{year}</p>
        <p className="text-sm font-bold text-white">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Progress bar ──────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'gold' }: { value: number; max?: number; color?: 'gold' | 'green' | 'red' | 'blue' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colorClass =
    color === 'green' ? 'from-emerald-500 to-emerald-400'
    : color === 'red' ? 'from-red-500 to-red-400'
    : color === 'blue' ? 'from-blue-500 to-blue-400'
    : 'from-gold to-yellow-300';
  return (
    <div className="h-1.5 rounded-full bg-surface overflow-hidden">
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-300', colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Helpers for reading roleProfile safely ────────────────────
//
// Phase 4: custom roles now store data in typed tables (PlayerProfile,
// CoachProfile, … CommunityProfile). The API layer fetches the matching
// row and attaches it as `apiUser.typedProfile` (a plain Record).
// Generic roles (fan, official, etc.) still use the legacy
// `apiUser.roleProfile` JSON column.
//
// `getRoleProfile(apiUser, role)` returns the right Record for any
// role — renderers should use it instead of reading `apiUser.roleProfile`
// directly so the storage layer is abstracted.

export function isTypedRole(role: string | null | undefined): boolean {
  return !!role && TYPED_PROFILE_ROLES.has(role);
}

export function getRoleProfile(
  apiUser: { role?: string; roleProfile?: Record<string, unknown> | null; typedProfile?: Record<string, unknown> | null } | null,
  role: string
): Record<string, unknown> {
  if (!apiUser) return {};
  // Custom role: prefer typed profile row (from typed table)
  if (isTypedRole(role) && apiUser.typedProfile) {
    return apiUser.typedProfile;
  }
  // Fallback: legacy JSON blob (also used by generic roles)
  return (apiUser.roleProfile || {}) as Record<string, unknown>;
}

export function rpString(rp: Record<string, unknown> | null | undefined, key: string): string {
  if (!rp) return '';
  const v = rp[key];
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
}

export function rpNumber(rp: Record<string, unknown> | null | undefined, key: string): number {
  if (!rp) return 0;
  const v = rp[key];
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export function rpArray(rp: Record<string, unknown> | null | undefined, key: string): unknown[] {
  if (!rp) return [];
  const v = rp[key];
  return Array.isArray(v) ? v : [];
}

export function rpObject(rp: Record<string, unknown> | null | undefined, key: string): Record<string, unknown> | null {
  if (!rp) return null;
  const v = rp[key];
  return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;
}

'use client';

// ─── Profile Completeness Banner ───────────────────────────────
//
// Shown on the user's OWN profile (ProfileTab) when completeness
// is below 100%. Calls computeCompleteness() from the engine and
// renders a progress bar + the top 3 missing fields with a CTA
// to open EditProfileModal.

import { useState } from 'react';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { computeCompleteness } from './registry';
import { cn } from '@/lib/utils';

export function ProfileCompletenessBanner({
  role,
  roleProfile,
  baseProfile,
  onEdit,
}: {
  role: string;
  roleProfile: Record<string, unknown> | null | undefined;
  baseProfile?: { name?: string; handle?: string; bio?: string; avatarUrl?: string | null; location?: string | null } | null;
  onEdit: () => void;
}) {
  const dismissKey = `ss_dismiss_completeness_${role}`;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(dismissKey) === '1'; } catch { return false; }
  });
  const result = computeCompleteness(role, roleProfile, baseProfile);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(dismissKey, '1'); } catch { /* ignore */ }
  };

  // Don't nag when profile already looks solid for day-to-day use
  if (dismissed) return null;
  if (result.pct >= 80) return null;
  if (result.pct >= 100) return null;

  const topMissing = result.missing.slice(0, 3);
  const remainingCount = result.missing.length - topMissing.length;

  return (
    <div className="glass-card rounded-2xl p-4 mb-3 border border-gold/30 bg-gold/5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <AlertCircle className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Profile {result.pct}% complete</p>
            <p className="text-xs text-muted-foreground">
              {result.missing.length} field{result.missing.length === 1 ? '' : 's'} left to fill.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-white text-xs"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-surface overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-yellow-300 transition-all duration-300"
          style={{ width: `${result.pct}%` }}
        />
      </div>

      {/* Top 3 missing fields */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {topMissing.map(m => (
          <span key={m.key} className="rounded-full bg-surface border border-surface-border px-2 py-0.5 text-[10px] text-muted-foreground">
            {m.label}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="rounded-full bg-surface border border-surface-border px-2 py-0.5 text-[10px] text-muted-foreground">
            +{remainingCount} more
          </span>
        )}
      </div>

      <button
        onClick={onEdit}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 rounded-xl bg-gold py-2 text-xs font-bold text-black',
          'hover:bg-gold/90 transition-colors'
        )}
      >
        Complete your profile
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

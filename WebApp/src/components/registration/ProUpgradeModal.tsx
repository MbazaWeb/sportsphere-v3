'use client';
import { apiFetch } from '@/lib/api';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, ShieldCheck, Sparkles,
  Search, Loader2, Check, AlertCircle, RefreshCw, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────
interface RoleType {
  id: string; name: string; slug: string; description: string | null;
}

interface Role {
  id: string; name: string; slug: string; icon: string; description: string;
  category: string;
  types: RoleType[];
}

type Step = 'role' | 'type' | 'submit' | 'success';
const STEPS: { id: Step; label: string }[] = [
  { id: 'role',    label: 'Role'    },
  { id: 'type',    label: 'Type'    },
  { id: 'submit',  label: 'Confirm' },
  { id: 'success', label: 'Done'    },
];

// ─── Step indicator ───────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {STEPS.map((s, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={s.id} className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all',
                isDone && 'bg-gold text-black',
                isActive && 'bg-gold text-black ring-2 ring-gold/30 ring-offset-2 ring-offset-background',
                !isDone && !isActive && 'bg-surface text-muted-foreground'
              )}
            >
              {isDone ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 w-4 rounded-full transition-colors', i < currentIndex ? 'bg-gold' : 'bg-surface')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Card skeletons ───────────────────────────────────────────
function RoleCardSkeleton() {
  return (
    <div className="flex items-center gap-3 glass-card rounded-xl px-4 py-3 animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-surface" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-24 rounded bg-surface" />
        <div className="h-2.5 w-40 rounded bg-surface/60" />
      </div>
      <div className="h-4 w-4 rounded bg-surface/60" />
    </div>
  );
}

// ─── Step 1: Choose Role ──────────────────────────────────────
function ChooseRoleStep({
  roles,
  loading,
  error,
  onSelect,
  onClose,
  onRetry,
  selectedRoleId,
}: {
  roles: Role[];
  loading: boolean;
  error: string;
  onSelect: (role: Role) => void;
  onClose: () => void;
  onRetry: () => void;
  selectedRoleId: string | null;
}) {
  const [query, setQuery] = useState('');

  // Group roles by category, then filter by query
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const categories: Record<string, Role[]> = {};
    for (const role of roles) {
      if (role.slug === 'fan') continue;
      if (q) {
        const hay = (role.name + ' ' + role.description + ' ' + role.category).toLowerCase();
        if (!hay.includes(q)) continue;
      }
      if (!categories[role.category]) categories[role.category] = [];
      categories[role.category].push(role);
    }
    return categories;
  }, [roles, query]);

  const categoryLabels: Record<string, string> = {
    individual: 'Individuals (Players, Coaches, Scouts, Journalists, Creators, Analysts, Commentators, Agents)',
    team_entity: 'Teams & Venues',
    organization: 'Organizations, Competitions & Leagues',
    commercial: 'Businesses & Sponsors',
    official: 'Officials (Referees & Match Officials)',
    support: 'Support Staff',
    admin: 'Administration',
  };

  const hasAnyRole = roles.filter(r => r.slug !== 'fan').length > 0;
  const hasFilteredMatches = Object.values(grouped).some(arr => arr.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header — sticky */}
      <div className="flex-shrink-0 mb-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-gold-gradient">Upgrade to PRO</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Choose your professional role</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search box — only if there are roles to search */}
        {hasAnyRole && !loading && !error && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles…"
              className="w-full rounded-xl bg-surface border border-surface-border py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/30 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-surface-elevated text-muted-foreground hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto touch-scroll scrollbar-hide -mx-1 px-1 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        {loading ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Loading roles…</p>
            {Array.from({ length: 6 }).map((_, i) => <RoleCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm font-semibold text-white mb-1">Couldn&apos;t load roles</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">{error}</p>
            <button
              onClick={onRetry}
              className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-black hover:bg-gold/90 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : !hasAnyRole ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-10 w-10 text-gold mb-3" />
            <p className="text-sm font-semibold text-white mb-1">No roles available</p>
            <p className="text-xs text-muted-foreground max-w-xs">Please check back later.</p>
          </div>
        ) : !hasFilteredMatches ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-white mb-1">No matches for &ldquo;{query}&rdquo;</p>
            <button
              onClick={() => setQuery('')}
              className="mt-2 text-xs text-gold hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {Object.entries(grouped).map(([cat, catRoles]) => catRoles.length > 0 && (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[cat] || cat}
                </p>
                <div className="flex flex-col gap-2">
                  {catRoles.map(role => {
                    const isSelected = selectedRoleId === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => onSelect(role)}
                        className={cn(
                          'group flex items-center gap-3 glass-card rounded-xl px-4 py-3 text-left transition-all glass-card-hover',
                          isSelected && 'border-gold/60 bg-gold/5'
                        )}
                      >
                        <span className="text-2xl flex-shrink-0">{role.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{role.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
                        </div>
                        {isSelected ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-black flex-shrink-0">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-gold/60 flex-shrink-0 transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Choose Type ──────────────────────────────────────
function ChooseTypeStep({
  role,
  onSelect,
  onBack,
  selectedTypeId,
}: {
  role: Role;
  onSelect: (type: RoleType) => void;
  onBack: () => void;
  selectedTypeId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // Detect if content overflows and show a subtle "scroll for more" hint
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setShowScrollHint(el.scrollHeight - el.clientHeight > 40 && el.scrollTop < 20);
    check();
    el.addEventListener('scroll', check, { passive: true });
    // Re-check after layout settles
    const t = setTimeout(check, 100);
    return () => { el.removeEventListener('scroll', check); clearTimeout(t); };
  }, [role.types.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-white truncate">{role.icon} {role.name}</h2>
          <p className="text-xs text-muted-foreground">Choose your type</p>
        </div>
      </div>

      {/* Scrollable list */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto touch-scroll scrollbar-hide -mx-1 px-1 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="flex flex-col gap-2">
          {role.types.map(type => {
            const isSelected = selectedTypeId === type.id;
            return (
              <button
                key={type.id}
                onClick={() => onSelect(type)}
                className={cn(
                  'group flex items-center justify-between glass-card rounded-xl px-4 py-3 text-left transition-all glass-card-hover',
                  isSelected && 'border-gold/60 bg-gold/5'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{type.name}</p>
                  {type.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{type.description}</p>
                  )}
                </div>
                {isSelected ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-black flex-shrink-0 ml-3">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-gold/60 flex-shrink-0 ml-3 transition-colors" />
                )}
              </button>
            );
          })}
        </div>

        {/* Subtle "scroll for more" hint — fades in when content overflows and user is near top */}
        <AnimatePresence>
          {showScrollHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 text-muted-foreground"
            >
              <span className="text-[10px] font-medium tracking-wide">Scroll for more</span>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronDown className="h-3 w-3" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step 3: Submit ───────────────────────────────────────────
function SubmitStep({
  role,
  roleType,
  onBack,
  onSubmit,
  submitting,
}: {
  role: Role;
  roleType: RoleType;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 mb-4 flex items-center gap-3">
        <button onClick={onBack} disabled={submitting} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors disabled:opacity-50">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-black text-white">Confirm Upgrade</h2>
          <p className="text-xs text-muted-foreground">Review and submit</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto touch-scroll scrollbar-hide -mx-1 px-1 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        {/* Selection summary */}
        <div className="mb-4 rounded-xl bg-gold/10 border border-gold/20 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{role.icon}</span>
            <div className="min-w-0">
              <p className="text-base font-bold text-white truncate">{role.name}</p>
              <p className="text-sm text-gold">{roleType.name}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
        </div>

        {/* Verification notice */}
        <div className="mb-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-yellow-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-yellow-400">Verification Required</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Your profile will be reviewed by our admin team within 1-3 business days. Once approved, you&apos;ll receive a verified badge.
          </p>
        </div>

        {/* What you get */}
        <div className="mb-4 rounded-xl bg-surface border border-surface-border p-4">
          <p className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">What you get</p>
          <ul className="space-y-2">
            {[
              'Gold verified badge on your profile',
              'Exclusive Pro-only features and analytics',
              'Priority placement in feeds and search',
              'Direct access to Pro creator tools',
            ].map((perk, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-gold flex-shrink-0 mt-0.5" strokeWidth={3} />
                <span className="text-xs text-muted-foreground">{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="flex-shrink-0 pt-2 border-t border-surface-border">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className={cn(
            'w-full rounded-xl py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2',
            submitting
              ? 'bg-surface border border-surface-border text-muted-foreground cursor-not-allowed'
              : 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]'
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Submit for Verification
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Success ──────────────────────────────────────────
function SuccessStep({ onClose, autoApproved }: { onClose: () => void; autoApproved: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className={cn(
          'mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-[0_4px_30px_rgba(245,197,24,0.3)]',
          autoApproved ? 'bg-gold' : 'bg-surface border-2 border-gold'
        )}
      >
        <ShieldCheck className={cn('h-10 w-10', autoApproved ? 'text-black' : 'text-gold')} strokeWidth={3} />
      </motion.div>
      {autoApproved ? (
        <>
          <h2 className="mb-2 text-2xl font-black text-gold-gradient">You&apos;re Verified!</h2>
          <p className="mb-2 text-sm text-muted-foreground max-w-xs">
            Your PRO role is active. Your verified badge is now live on your profile.
          </p>
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-gold/10 border border-gold/20 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <span className="text-xs font-semibold text-gold">Verified Badge Active</span>
          </div>
        </>
      ) : (
        <>
          <h2 className="mb-2 text-2xl font-black text-gold-gradient">Request Submitted!</h2>
          <p className="mb-6 text-sm text-muted-foreground max-w-xs">
            Your role upgrade is under admin review. You&apos;ll be notified once approved and your verified badge will go live.
          </p>
        </>
      )}
      <button onClick={onClose} className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors shadow-[0_4px_20px_rgba(245,197,24,0.2)]">
        {autoApproved ? 'View My Profile' : 'Continue'}
      </button>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────
export default function ProUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const submitRoleUpgrade = useAuthStore(s => s.submitRoleUpgrade);

  const [step, setStep] = useState<Step>('role');
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedType, setSelectedType] = useState<RoleType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [autoApproved, setAutoApproved] = useState(false);

  // Fetch roles from API on modal open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function loadRoles() {
      setRolesLoading(true);
      setRolesError('');
      try {
        const r = await apiFetch('/api/roles');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as Role[];
        if (!cancelled) setRoles(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Network error. Please try again.';
          setRolesError(msg);
        }
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    }
    loadRoles();
    return () => { cancelled = true; };
  }, [open]);

  // Retry handler for the error state — re-runs the same fetch.
  // Wrapped in useCallback so it can be safely passed as a prop without
  // causing child re-renders.
  const refetchRoles = useCallback(() => {
    setRolesLoading(true);
    setRolesError('');
    apiFetch('/api/roles')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Role[]) => setRoles(Array.isArray(data) ? data : []))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Network error. Please try again.';
        setRolesError(msg);
      })
      .finally(() => setRolesLoading(false));
  }, []);

  // Reset on close
  const handleClose = () => {
    if (submitting) return;
    onClose();
    setTimeout(() => {
      setStep('role');
      setSelectedRole(null);
      setSelectedType(null);
      setError('');
    }, 300);
  };

  if (!open) return null;

  const handleSubmit = async () => {
    if (!selectedRole || !selectedType) return;
    setSubmitting(true);
    setError('');
    const result = await submitRoleUpgrade({
      roleId: selectedRole.id,
      roleTypeId: selectedType.id,
    });
    setSubmitting(false);
    if (result.ok) {
      setAutoApproved(result.autoApproved ?? false);
      setStep('success');
    } else {
      setError(result.error || 'Upgrade failed.');
    }
  };

  // Title for the step indicator
  const stepTitle = step === 'role' ? 'Upgrade to PRO'
    : step === 'type' ? (selectedRole ? `${selectedRole.icon} ${selectedRole.name}` : 'Choose Type')
    : step === 'submit' ? 'Confirm Upgrade'
    : 'Complete';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
      // Lock background scroll while modal is open
      style={{ overscrollBehavior: 'contain' }}
      // Click-outside-to-close (disabled while submitting or on success step)
      onClick={() => { if (step !== 'success' && !submitting) handleClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        // Stop propagation so clicks inside the modal don't bubble up to backdrop close
        onClick={(e) => e.stopPropagation()}
        className="pro-modal-root w-full max-w-lg rounded-t-3xl sm:rounded-3xl glass-card flex flex-col overflow-hidden"
        style={{
          // Safe-area inset padding (bottom-sheet style on mobile, centered on desktop)
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* @supports fallback for browsers without dvh (pre-2022). Tailwind's
            h-[90dvh] / max-h-[90dvh] become height: 90dvh which older browsers
            ignore (height stays auto = unbounded). This rule sets vh fallback. */}
        <style>{`
          .pro-modal-root {
            max-height: 90dvh;
            height: 90dvh;
          }
          @supports not (height: 100dvh) {
            .pro-modal-root {
              max-height: 90vh !important;
              height: 90vh !important;
            }
          }
        `}</style>

        {/* Sticky header: title + step indicator + close */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-surface-border bg-surface-elevated/50 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black text-white truncate">{stepTitle}</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pro Activation</p>
            </div>
            {step !== 'success' && (
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {/* Step indicator (hidden on success) */}
          {step !== 'success' && <StepIndicator current={step} />}
        </div>

        {/* Inline error toast */}
        {error && (
          <div className="flex-shrink-0 mx-5 mt-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400 flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-400">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Body — single scroll parent */}
        <div className="flex-1 overflow-hidden px-5 py-4 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {step === 'role' && (
                <ChooseRoleStep
                  roles={roles}
                  loading={rolesLoading}
                  error={rolesError}
                  onSelect={(r) => { setSelectedRole(r); setStep('type'); }}
                  onClose={handleClose}
                  onRetry={refetchRoles}
                  selectedRoleId={selectedRole?.id ?? null}
                />
              )}
              {step === 'type' && selectedRole && (
                <ChooseTypeStep
                  role={selectedRole}
                  onSelect={(t) => { setSelectedType(t); setStep('submit'); }}
                  onBack={() => setStep('role')}
                  selectedTypeId={selectedType?.id ?? null}
                />
              )}
              {step === 'submit' && selectedRole && selectedType && (
                <SubmitStep
                  role={selectedRole}
                  roleType={selectedType}
                  onBack={() => setStep('type')}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                />
              )}
              {step === 'success' && <SuccessStep onClose={handleClose} autoApproved={autoApproved} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

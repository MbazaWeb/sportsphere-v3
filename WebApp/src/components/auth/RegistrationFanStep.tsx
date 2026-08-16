'use client';
import { apiFetch } from '@/lib/api';
const FALLBACK_SPORTS = ["Football", "Basketball", "Tennis", "Cricket", "Rugby", "Athletics", "Swimming", "Boxing", "Volleyball", "Formula 1"];

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Search, ShieldCheck, Loader2, Check, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PasswordInput } from '@/components/ui/PasswordInput';

// ─── Types for roles ──────────────────────────────────────────
interface RoleType { id: string; name: string; slug: string; description: string | null }
interface Role { id: string; name: string; slug: string; icon: string; description: string; category: string; types: RoleType[] }

export interface RegistrationData {
  name: string; email: string; handle: string; password: string; sports: string[];
  roleId?: string; roleTypeId?: string; selectedRole?: Role | null; selectedType?: RoleType | null;
}

interface RegistrationFanStepProps {
  onBack: () => void;
  onComplete: (data: RegistrationData) => void;
}

/**
 * Generate a handle from a full name.
 * "David Mbazza" → "davidmbazza"
 * Strips accents, lowers case, removes non-alphanumeric, joins parts.
 */
function handleFromName(fullName: string): string {
  return fullName
    .trim()
    .toLowerCase()
    // Normalize accented characters (é → e, ñ → n, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Split on any non-letter/number character
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join('')
    .slice(0, 30);
}

type HandleStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function RegistrationFanStep({ onBack, onComplete }: RegistrationFanStepProps) {
  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(false);
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sports, setSports] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState('');

  // Debounce timer for handle check
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Role selection
  const [mode, setMode] = useState<'fan' | 'pro'>('fan');
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedType, setSelectedType] = useState<RoleType | null>(null);
  const [roleQuery, setRoleQuery] = useState('');

  // Sports fetching
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/sports');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setAvailableSports(data.map((s: { name: string }) => s.name));
        } else {
          setAvailableSports(FALLBACK_SPORTS);
        }
      } catch { if (!cancelled) setAvailableSports(FALLBACK_SPORTS); }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Auto-generate handle from name ───────────────────────
  useEffect(() => {
    if (handleManuallyEdited) return; // Don't overwrite user edits
    const generated = handleFromName(name);
    if (generated.length >= 2) {
      setHandle('@' + generated);
    } else if (name.trim() === '') {
      setHandle('');
      setHandleStatus('idle');
    }
  }, [name, handleManuallyEdited]);

  // ─── Check handle availability (debounced) ────────────────
  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);

    const raw = handle.replace(/^@/, '').trim();

    // Validate format first
    if (!raw) {
      setHandleStatus('idle');
      return;
    }
    if (raw.length < 3 || raw.length > 30) {
      setHandleStatus('invalid');
      return;
    }

    setHandleStatus('checking');

    checkTimer.current = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/auth/check-handle?handle=${encodeURIComponent(raw)}`);
        if (res.ok) {
          const data = await res.json();
          setHandleStatus(data.available ? 'available' : 'taken');
        } else {
          setHandleStatus('idle'); // API error, don't block
        }
      } catch {
        setHandleStatus('idle');
      }
    }, 400);

    return () => { if (checkTimer.current) clearTimeout(checkTimer.current); };
  }, [handle]);

  // Handle user manually editing the handle
  const handleHandleChange = useCallback((v: string) => {
 setHandleManuallyEdited(true);
    const cleaned = v.startsWith('@') ? v : '@' + v;
    setHandle(cleaned);
  }, []);

  // Reset manual edit flag when name changes (allow re-generation)
  useEffect(() => {
    if (name.trim().length > 0) {
      setHandleManuallyEdited(false);
    }
  }, [name]);

  // Fetch roles when PRO mode selected
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const r = await apiFetch('/api/roles');
      if (r.ok) {
        const data = await r.json();
        setRoles(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    setRolesLoading(false);
  }, []);

  useEffect(() => {
    if (mode === 'pro' && roles.length === 0) fetchRoles();
  }, [mode, fetchRoles, roles.length]);

  const toggleSport = (s: string) => setSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const passwordsMatch = password && confirm && password === confirm;
  const handleValid = handleStatus === 'available';
  const formValid = name.trim() && email.trim() && handleValid && password.length >= 8 && passwordsMatch;
  const proValid = formValid && selectedRole && selectedType;
  const canSubmit = mode === 'fan' ? formValid : proValid;

  // Filter roles for search
  const filteredRoles = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    return roles.filter(r => {
      if (r.slug === 'fan') return false;
      if (!q) return true;
      return (r.name + ' ' + r.description + ' ' + r.category).toLowerCase().includes(q);
    });
  }, [roles, roleQuery]);

  const categoryLabels: Record<string, string> = {
    individual: 'Individuals', team_entity: 'Teams & Venues',
    organization: 'Organizations', commercial: 'Businesses',
    official: 'Officials', support: 'Support Staff',
  };

  const grouped = useMemo(() => {
    const m: Record<string, Role[]> = {};
    for (const r of filteredRoles) {
      if (!m[r.category]) m[r.category] = [];
      m[r.category].push(r);
    }
    return m;
  }, [filteredRoles]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError('');
    onComplete({
      name, email, handle, password, sports,
      roleId: selectedRole?.id,
      roleTypeId: selectedType?.id,
      selectedRole,
      selectedType,
    });
  };

  const selectRole = (r: Role) => {
    setSelectedRole(r);
    setSelectedType(null); // reset type when role changes
  };

  // Handle status UI
  const handleRaw = handle.replace(/^@/, '').trim();
  const handleStatusUI = useMemo(() => {
    if (!handleRaw) return null;
    switch (handleStatus) {
      case 'checking':
        return <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Checking...</div>;
      case 'available':
        return <div className="flex items-center gap-1.5 text-xs text-emerald-400"><Check className="h-3 w-3" /> Available</div>;
      case 'taken':
        return <div className="flex items-center gap-1.5 text-xs text-red-400"><XCircle className="h-3 w-3" /> Taken — try another</div>;
      case 'invalid':
        return <div className="flex items-center gap-1.5 text-xs text-amber-400"><XCircle className="h-3 w-3" /> 3-30 characters</div>;
      default:
        return null;
    }
  }, [handleStatus, handleRaw]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-3 sm:mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-black text-white">Join SportSphere</h2>
      </div>

      {/* ─── Role Toggle ─────────────────────────────── */}
      <div className="mb-4 flex gap-1 bg-surface rounded-xl p-1">
        <button onClick={() => setMode('fan')}
          className={cn('flex-1 rounded-lg py-2 text-xs font-semibold transition-colors',
            mode === 'fan' ? 'bg-gold text-black' : 'text-muted-foreground hover:text-white')}>
          ⚽ Fan
        </button>
        <button onClick={() => setMode('pro')}
          className={cn('flex-1 rounded-lg py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1',
            mode === 'pro' ? 'bg-gold text-black' : 'text-muted-foreground hover:text-white')}>
          <ShieldCheck className="h-3 w-3" /> PRO Role
        </button>
      </div>

      {mode === 'pro' && (
        <p className="mb-3 text-xs text-muted-foreground">
          Register directly as a PRO. Your account will be reviewed and verified by admin.
        </p>
      )}

      {/* ─── Common Fields ───────────────────────────── */}
      <div className="flex flex-col gap-2.5 sm:gap-3 mb-3 sm:mb-4">
        {/* Full Name */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name</label>
          <input
            type="text"
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-xl bg-surface border border-surface-border px-4 py-2.5 sm:py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
          <input
            type="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-xl bg-surface border border-surface-border px-4 py-2.5 sm:py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
          />
        </div>

        {/* Handle — auto-generated from name, editable */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Handle</label>
          <input
            type="text"
            value={handle} onChange={e => handleHandleChange(e.target.value)}
            placeholder="@yourhandle"
            className={cn(
              'w-full rounded-xl bg-surface border px-4 py-2.5 sm:py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors',
              handleStatus === 'available' ? 'border-emerald-500/50 focus:ring-emerald-400' :
              handleStatus === 'taken' ? 'border-red-500/50 focus:ring-red-400' :
              handleStatus === 'invalid' ? 'border-amber-500/50 focus:ring-amber-400' :
              'border-surface-border focus:ring-gold'
            )}
          />
          {handleStatusUI}
          {!handleManuallyEdited && handleRaw.length >= 3 && (
            <p className="mt-1 text-[10px] text-muted-foreground/60">Auto-generated from your name — tap to edit</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Password <span className="text-muted-foreground/70">(min 8 chars)</span></label>
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Confirm Password</label>
          <PasswordInput
            value={confirm} onChange={setConfirm}
            autoComplete="new-password" placeholder="Re-enter password"
            className={cn(confirm && !passwordsMatch && 'border-red-500/50 focus:ring-red-500')}
          />
          {confirm && !passwordsMatch && (
            <p className="mt-1 text-[11px] text-red-400">Passwords do not match.</p>
          )}
        </div>
      </div>

      {/* ─── PRO Role + Type Selection ────────────────── */}
      {mode === 'pro' && (
        <div className="mb-4 border-t border-surface-border pt-4">
          {/* Search */}
          {!selectedRole && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input type="text" value={roleQuery} onChange={e => setRoleQuery(e.target.value)}
                placeholder="Search roles…"
                className="w-full rounded-xl bg-surface border border-surface-border py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-gold/40 transition-colors"
              />
            </div>
          )}

          {rolesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </div>
          ) : !selectedRole ? (
            /* ── Role Grid ── */
            <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-3">
              {Object.entries(grouped).map(([cat, catRoles]) => catRoles.length > 0 && (
                <div key={cat}>
                  <p className="mb-1.5 text-[10px] font-bold text-gold uppercase tracking-wider">{categoryLabels[cat] || cat}</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {catRoles.map(role => (
                      <button key={role.id} onClick={() => selectRole(role)}
                        className="flex items-center gap-3 rounded-xl bg-surface border border-surface-border px-3 py-2.5 text-left transition-all hover:border-gold/40">
                        <span className="text-xl flex-shrink-0">{role.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{role.name}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{role.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : !selectedType ? (
            /* ── Type Selection ── */
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => { setSelectedRole(null); setSelectedType(null); }}
                  className="text-xs text-gold hover:underline">← Back</button>
                <span className="text-sm font-bold text-white">{selectedRole!.icon} {selectedRole!.name}</span>
              </div>
              <div className="max-h-36 overflow-y-auto scrollbar-hide space-y-1.5">
                {selectedRole!.types.map((type) => (
                  <button key={type.id} onClick={() => setSelectedType(type)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all border border-surface-border bg-surface hover:border-gold/40">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">{type.name}</p>
                      {type.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{type.description}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Selected Summary ── */
            <div className="rounded-xl bg-gold/10 border border-gold/20 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedRole.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{selectedRole.name}</p>
                  <p className="text-[10px] text-gold">{selectedType.name}</p>
                </div>
                <button onClick={() => setSelectedType(null)} className="text-[10px] text-gold hover:underline">Change</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Sports (optional) ────────────────────────── */}
      <div className="mb-4 sm:mb-6">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Sports you follow <span className="text-muted-foreground/50">(optional)</span></label>
        <div className="flex flex-wrap gap-2">
          {availableSports.map(sport => (
            <button key={sport} onClick={() => toggleSport(sport)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                sports.includes(sport) ? 'bg-gold text-black' : 'bg-surface border border-surface-border text-muted-foreground hover:text-white')}>
              {sport}
            </button>
          ))}
        </div>
        {sports.length > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground">{sports.length} sport{sports.length !== 1 ? 's' : ''} selected</p>
        )}
      </div>

      {/* ─── Error message ────────────────────────────── */}
      {submitError && (
        <p className="mb-3 text-xs text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">{submitError}</p>
      )}

      {/* ─── Submit ───────────────────────────────────── */}
      <button onClick={handleSubmit} disabled={!canSubmit}
        className={cn('w-full rounded-xl py-3 text-sm font-bold transition-colors',
          canSubmit
            ? 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]'
            : 'bg-surface border border-surface-border text-muted-foreground cursor-not-allowed')}>
        <Sparkles className="mr-2 inline h-4 w-4" />
        {mode === 'fan' ? 'Create Fan Account' : `Register as ${selectedType?.name || 'PRO'}`}
      </button>
    </div>
  );
}

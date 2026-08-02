'use client';

import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AuthLogo } from '@/components/auth/AuthLogo';

// ─── SPORTS: fetched from /api/sports or fallback ──────────────
// ─── Sports data ──────────────────────────────────────────────
// E-2: Removed hardcoded SPORTS_FALLBACK. The FanStep now fetches
// from /api/sports and uses an empty fallback while loading.

/**
 * FanStep — Phase 5 compliant: Registration ONLY creates Fan accounts.
 * Every new user gets: Role=Fan, Type=Casual Fan, Status=Active, Verification=Not Verified.
 * Role upgrades are handled through the Pro Upgrade flow (/api/roles/upgrade).
 */
function FanStep({ onBack, onComplete }: { onBack: () => void; onComplete: (data: { name: string; email: string; handle: string; password: string; sports: string[] }) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sports, setSports] = useState<string[]>([]);

  // Fetch sports from API — no hardcoded fallback
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/sports');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setAvailableSports(data.map((s: { name: string }) => s.name));
      } catch { /* empty fallback stays */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleSport = (s: string) => setSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const passwordsMatch = password && confirm && password === confirm;
  const valid = name.trim() && email.trim() && handle.trim() && password.length >= 8 && passwordsMatch && sports.length > 0;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-black text-white">Join SportSphere</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Create your fan account and start following your favorite sports. You can upgrade to other roles later.
      </p>
      <div className="flex flex-col gap-3 mb-4">
        {[
          { label: 'Full Name', value: name, onChange: setName, placeholder: 'Your full name' },
          { label: 'Email', value: email, onChange: setEmail, placeholder: 'your@email.com', type: 'email' },
          { label: 'Handle', value: handle, onChange: (v: string) => setHandle(v.startsWith('@') ? v : '@' + v), placeholder: '@yourhandle' },
        ].map(({ label, value, onChange, placeholder, type }) => (
          <div key={label}>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
            <input
              type={type || 'text'}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
            />
          </div>
        ))}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password <span className="text-muted-foreground/70">(min 8 chars)</span></label>
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirm Password</label>
          <PasswordInput
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            placeholder="Re-enter password"
            className={cn(confirm && !passwordsMatch && 'border-red-500/50 focus:ring-red-500')}
          />
          {confirm && !passwordsMatch && (
            <p className="mt-1 text-[11px] text-red-400">Passwords do not match.</p>
          )}
        </div>
      </div>
      <div className="mb-6">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Sports you follow <span className="text-gold">*</span></label>
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
      <button onClick={() => valid && onComplete({ name, email, handle, password, sports })}
        disabled={!valid}
        className={cn('w-full rounded-xl py-3 text-sm font-bold transition-colors',
          valid ? 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]' : 'bg-surface border border-surface-border text-muted-foreground cursor-not-allowed')}>
        <Sparkles className="mr-2 inline h-4 w-4" />
        Create Fan Account
      </button>
    </div>
  );
}

// ─── Step 2: Success ─────────────────────────────────────────
function CompleteStep({ name, onClose }: { name: string; onClose: () => void }) {
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

// ─── Main Modal ───────────────────────────────────────────────
export default function RegistrationModal() {
  const registrationOpen = useAuthStore(s => s.registrationOpen);
  const setRegistrationOpen = useAuthStore(s => s.setRegistrationOpen);
  const completeRegistration = useAuthStore(s => s.completeRegistration);
  const setActiveTab = useNavigationStore(s => s.setActiveTab);

  const [step, setStep] = useState<'fan' | 'complete'>('fan');
  const [completedName, setCompletedName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleClose = () => {
    if (submitting) return;
    setRegistrationOpen(false);
    setTimeout(() => {
      setStep('fan');
      setSubmitError('');
    }, 300);
  };

  const handleCompleteClose = () => {
    handleClose();
    setActiveTab('profile');
  };

  if (!registrationOpen) return null;

  const handleFanComplete = async (d: { name: string; email: string; handle: string; password: string; sports: string[] }) => {
    setSubmitting(true);
    setSubmitError('');
    const result = await completeRegistration(d);
    setSubmitting(false);
    if (result.ok) {
      setCompletedName(d.name);
      setStep('complete');
    } else {
      setSubmitError(result.error || 'Registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl glass-card p-6 max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <AuthLogo />

        {submitError && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-xs text-red-400">{submitError}</p>
          </div>
        )}
        {submitting && (
          <div className="mb-4 rounded-xl bg-gold/10 border border-gold/20 p-3 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gold animate-pulse" />
            <p className="text-xs text-gold font-medium">Creating your account…</p>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
            {step === 'fan' && <FanStep onBack={handleClose} onComplete={handleFanComplete} />}
            {step === 'complete' && <CompleteStep name={completedName} onClose={handleCompleteClose} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

'use client';

import { useAuthStore } from '@/store/authStore';
import { useAppStore, ADVANCED_ROLES, SPORTS_LIST } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { ProfileTypeId } from '@/store/authStore';

// ─── Step 1: Choose registration type ────────────────────────
function ChooseStep({ onFan, onAdvanced, onClose }: { onFan: () => void; onAdvanced: () => void; onClose: () => void }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-black text-gold-gradient">Join SportSphere</h2>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Choose how you want to join the world's biggest sports network.</p>
      <div className="flex flex-col gap-3">
        <button onClick={onFan} className="flex items-center gap-4 rounded-2xl bg-gold p-4 text-left transition-all hover:bg-gold/90 active:scale-[0.98] shadow-[0_4px_20px_rgba(245,197,24,0.2)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/20">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-black">Fan</p>
            <p className="text-xs text-black/70">Quick sign up · Pick sports · Start following</p>
          </div>
          <ChevronRight className="h-5 w-5 text-black/60" />
        </button>
        <button onClick={onAdvanced} className="flex items-center gap-4 rounded-2xl glass-card p-4 text-left transition-all hover:border-gold/30 active:scale-[0.98] glass-card-hover">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
            <ShieldCheck className="h-6 w-6 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-white">Team / Player / Coach...</p>
            <p className="text-xs text-muted-foreground">Dedicated profile · Admin verified · Badge</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Fan registration ─────────────────────────────────
function FanStep({ onBack, onComplete }: { onBack: () => void; onComplete: (data: { name: string; email: string; handle: string; sports: string[] }) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [sports, setSports] = useState<string[]>([]);

  const toggleSport = (s: string) => setSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const valid = name.trim() && email.trim() && handle.trim() && sports.length > 0;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-black text-white">Create Fan Account</h2>
      </div>
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
      </div>
      <div className="mb-6">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Sports you follow <span className="text-gold">*</span></label>
        <div className="flex flex-wrap gap-2">
          {SPORTS_LIST.slice(0, 10).map(sport => (
            <button key={sport} onClick={() => toggleSport(sport)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors', 
                sports.includes(sport) ? 'bg-gold text-black' : 'bg-surface border border-surface-border text-muted-foreground hover:text-white')}>
              {sport}
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => valid && onComplete({ name, email, handle, sports })}
        disabled={!valid}
        className={cn('w-full rounded-xl py-3 text-sm font-bold transition-colors', 
          valid ? 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]' : 'bg-surface border border-surface-border text-muted-foreground cursor-not-allowed')}>
        <Sparkles className="mr-2 inline h-4 w-4" />
        Create Account
      </button>
    </div>
  );
}

// ─── Step 3: Advanced — choose role ──────────────────────────
function AdvancedRoleStep({ onBack, onSelect }: { onBack: () => void; onSelect: (role: ProfileTypeId) => void }) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-black text-white">Choose Profile Type</h2>
          <p className="text-xs text-muted-foreground">Select the type that best describes you</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {ADVANCED_ROLES.map(role => (
          <button key={role.id} onClick={() => onSelect(role.id as ProfileTypeId)}
            className="flex items-center justify-between glass-card rounded-xl px-4 py-3 text-left transition-colors hover:border-gold/30 glass-card-hover">
            <div>
              <p className="text-sm font-bold text-white">{role.label}</p>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Advanced form ────────────────────────────────────
function AdvancedFormStep({ role, onBack, onComplete }: {
  role: ProfileTypeId;
  onBack: () => void;
  onComplete: (data: { name: string; email: string; handle: string; role: ProfileTypeId; roleData: Record<string, string> }) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [org, setOrg] = useState('');
  const valid = name.trim() && email.trim() && handle.trim();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-black text-white capitalize">{role} Registration</h2>
          <p className="text-xs text-muted-foreground">Admin verified · Gets a badge</p>
        </div>
      </div>
      <div className="mb-4 rounded-xl bg-gold/10 border border-gold/20 p-3">
        <p className="text-xs text-gold font-medium">Your profile will be reviewed by our admin team within 1-3 business days.</p>
      </div>
      <div className="flex flex-col gap-3 mb-6">
        {[
          { label: 'Full Name / Organisation', value: name, onChange: setName, placeholder: `Your ${role} name` },
          { label: 'Email', value: email, onChange: setEmail, placeholder: 'your@email.com' },
          { label: 'Handle', value: handle, onChange: (v: string) => setHandle(v.startsWith('@') ? v : '@' + v), placeholder: `@your${role}` },
          { label: 'Organisation / Club (optional)', value: org, onChange: setOrg, placeholder: 'e.g. Manchester United FC' },
        ].map(({ label, value, onChange, placeholder }) => (
          <div key={label}>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
              className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold transition-colors" />
          </div>
        ))}
      </div>
      <button onClick={() => valid && onComplete({ name, email, handle, role, roleData: { organisation: org } })}
        disabled={!valid}
        className={cn('w-full rounded-xl py-3 text-sm font-bold transition-colors', 
          valid ? 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]' : 'bg-surface border border-surface-border text-muted-foreground cursor-not-allowed')}>
        <ShieldCheck className="mr-2 inline h-4 w-4" />
        Submit for Verification
      </button>
    </div>
  );
}

// ─── Step 5: Complete ─────────────────────────────────────────
function CompleteStep({ name, isAdvanced, onClose }: { name: string; isAdvanced: boolean; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold shadow-[0_4px_30px_rgba(245,197,24,0.3)]">
        <Check className="h-10 w-10 text-black" strokeWidth={3} />
      </div>
      <h2 className="mb-2 text-2xl font-black text-gold-gradient">Welcome{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
      {isAdvanced ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground max-w-xs">
            You&apos;re registered and can use SportSphere right away.
          </p>
          <div className="mb-6 w-full rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20">
                <ShieldCheck className="h-4 w-4 text-yellow-400" />
              </div>
              <p className="text-sm font-semibold text-yellow-400">Verification Badge Pending</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your profile is under admin review. Once approved (1–3 business days), you&apos;ll receive a verified badge visible to all users.
            </p>
          </div>
        </>
      ) : (
        <p className="mb-8 text-sm text-muted-foreground max-w-xs">
          Your account is ready. Start following teams, players, and communities.
        </p>
      )}
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
  const completeSimpleRegistration = useAuthStore(s => s.completeSimpleRegistration);
  const completeAdvancedRegistration = useAuthStore(s => s.completeAdvancedRegistration);

  const [step, setStep] = useState<'choose' | 'fan' | 'role' | 'form' | 'complete'>('choose');
  const [selectedRole, setSelectedRole] = useState<ProfileTypeId>('fan');
  const [completedName, setCompletedName] = useState('');
  const [isAdvanced, setIsAdvanced] = useState(false);

  const handleClose = () => {
    setRegistrationOpen(false);
    setTimeout(() => setStep('choose'), 300);
  };

  if (!registrationOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl glass-card p-6 max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
            {step === 'choose'   && <ChooseStep onFan={() => setStep('fan')} onAdvanced={() => setStep('role')} onClose={handleClose} />}
            {step === 'fan'      && <FanStep onBack={() => setStep('choose')} onComplete={d => { setCompletedName(d.name); setIsAdvanced(false); completeSimpleRegistration(d); setStep('complete'); }} />}
            {step === 'role'     && <AdvancedRoleStep onBack={() => setStep('choose')} onSelect={r => { setSelectedRole(r); setStep('form'); }} />}
            {step === 'form'     && <AdvancedFormStep role={selectedRole} onBack={() => setStep('role')} onComplete={d => { setCompletedName(d.name); setIsAdvanced(true); completeAdvancedRegistration(d); setStep('complete'); }} />}
            {step === 'complete' && <CompleteStep name={completedName} isAdvanced={isAdvanced} onClose={handleClose} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

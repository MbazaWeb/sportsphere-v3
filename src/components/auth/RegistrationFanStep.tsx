'use client';
import { apiFetch } from '@/lib/api';
const FALLBACK_SPORTS = ["Football", "Basketball", "Tennis", "Cricket", "Rugby", "Athletics", "Swimming", "Boxing", "Volleyball", "Formula 1"];

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PasswordInput } from '@/components/ui/PasswordInput';

interface RegistrationFanStepProps {
  onBack: () => void;
  onComplete: (data: { name: string; email: string; handle: string; password: string; sports: string[] }) => void;
}

export function RegistrationFanStep({ onBack, onComplete }: RegistrationFanStepProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sports, setSports] = useState<string[]>([]);

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
      } catch {
        if (!cancelled) setAvailableSports(FALLBACK_SPORTS);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleSport = (s: string) => setSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const passwordsMatch = password && confirm && password === confirm;
  const valid = name.trim() && email.trim() && handle.trim() && password.length >= 8 && passwordsMatch;

  return (
    <div className="flex flex-col">
      <div className="mb-3 sm:mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-black text-white">Join SportSphere</h2>
      </div>
      <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
        Create your fan account and start following your favorite sports. You can upgrade to other roles later.
      </p>
      <div className="flex flex-col gap-2.5 sm:gap-3 mb-3 sm:mb-4">
        {[
          { label: 'Full Name', value: name, onChange: setName, placeholder: 'Your full name' },
          { label: 'Email', value: email, onChange: setEmail, placeholder: 'your@email.com', type: 'email' },
          { label: 'Handle', value: handle, onChange: (v: string) => setHandle(v.startsWith('@') ? v : '@' + v), placeholder: '@yourhandle' },
        ].map(({ label, value, onChange, placeholder, type }) => (
          <div key={label}>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
            <input
              type={type || 'text'}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl bg-surface border border-surface-border px-4 py-2.5 sm:py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Password <span className="text-muted-foreground/70">(min 8 chars)</span></label>
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Confirm Password</label>
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

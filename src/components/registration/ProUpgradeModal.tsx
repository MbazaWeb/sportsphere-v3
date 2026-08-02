'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, ShieldCheck, Sparkles } from 'lucide-react';
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

// ─── Step 1: Choose Role ──────────────────────────────────────
function ChooseRoleStep({
  roles,
  onSelect,
  onClose,
}: {
  roles: Role[];
  onSelect: (role: Role) => void;
  onClose: () => void;
}) {
  // Group roles by category
  const categories: Record<string, Role[]> = {};
  for (const role of roles) {
    if (role.slug === 'fan') continue; // skip fan — can't upgrade to fan
    const cat = role.category;
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(role);
  }

  const categoryLabels: Record<string, string> = {
    individual: 'Individuals',
    team_entity: 'Teams & Entities',
    organization: 'Organizations',
    commercial: 'Commercial',
    official: 'Officials',
    support: 'Support Staff',
    admin: 'Administration',
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

// ─── Step 2: Choose Type ──────────────────────────────────────
function ChooseTypeStep({
  role,
  onSelect,
  onBack,
}: {
  role: Role;
  onSelect: (type: RoleType) => void;
  onBack: () => void;
}) {
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
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-black text-white">Confirm Upgrade</h2>
          <p className="text-xs text-muted-foreground">Review and submit</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-gold/10 border border-gold/20 p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{role.icon}</span>
          <div>
            <p className="text-base font-bold text-white">{role.name}</p>
            <p className="text-sm text-gold">{roleType.name}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
      </div>

      <div className="mb-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-yellow-400" />
          <p className="text-xs font-semibold text-yellow-400">Verification Required</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Your profile will be reviewed by our admin team within 1-3 business days. Once approved, you&apos;ll receive a verified badge.
        </p>
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className={cn(
          'w-full rounded-xl py-3 text-sm font-bold transition-colors',
          submitting
            ? 'bg-surface border border-surface-border text-muted-foreground cursor-not-allowed'
            : 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]'
        )}
      >
        <ShieldCheck className="mr-2 inline h-4 w-4" />
        {submitting ? 'Submitting…' : 'Submit for Verification'}
      </button>
    </div>
  );
}

// ─── Step 4: Success ──────────────────────────────────────────
function SuccessStep({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold shadow-[0_4px_30px_rgba(245,197,24,0.3)]">
        <ShieldCheck className="h-10 w-10 text-black" strokeWidth={3} />
      </div>
      <h2 className="mb-2 text-2xl font-black text-gold-gradient">Upgrade Submitted!</h2>
      <p className="mb-6 text-sm text-muted-foreground max-w-xs">
        Your role upgrade is under admin review. You&apos;ll receive a notification once it&apos;s approved.
      </p>
      <button onClick={onClose} className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors shadow-[0_4px_20px_rgba(245,197,24,0.2)]">
        Continue
      </button>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────
export default function ProUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const submitRoleUpgrade = useAuthStore(s => s.submitRoleUpgrade);

  const [step, setStep] = useState<'role' | 'type' | 'submit' | 'success'>('role');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedType, setSelectedType] = useState<RoleType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch roles from API
  useEffect(() => {
    if (open) {
      fetch('/api/roles')
        .then(r => r.json())
        .then(data => setRoles(data))
        .catch(() => {});
    }
  }, [open]);

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
      setStep('success');
    } else {
      setError(result.error || 'Upgrade failed.');
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
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
            {step === 'role' && (
              <ChooseRoleStep
                roles={roles}
                onSelect={(r) => { setSelectedRole(r); setStep('type'); }}
                onClose={handleClose}
              />
            )}
            {step === 'type' && selectedRole && (
              <ChooseTypeStep
                role={selectedRole}
                onSelect={(t) => { setSelectedType(t); setStep('submit'); }}
                onBack={() => setStep('role')}
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
            {step === 'success' && <SuccessStep onClose={handleClose} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

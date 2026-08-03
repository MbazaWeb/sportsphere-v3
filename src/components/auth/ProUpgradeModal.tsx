'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { ProUpgradeRoleStep } from './ProUpgradeRoleStep';
import { ProUpgradeTypeStep } from './ProUpgradeTypeStep';
import { ProUpgradeSubmitStep } from './ProUpgradeSubmitStep';
import { ProUpgradeSuccessStep } from './ProUpgradeSuccessStep';

interface RoleType { id: string; name: string; slug: string; description: string | null; }
interface Role { id: string; name: string; slug: string; icon: string; description: string; category: string; types: RoleType[]; }

export default function ProUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const submitRoleUpgrade = useAuthStore(s => s.submitRoleUpgrade);

  const [step, setStep] = useState<'role' | 'type' | 'submit' | 'success'>('role');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedType, setSelectedType] = useState<RoleType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/roles')
        .then(r => r.json())
        .then(data => setRoles(data))
        .catch(() => {});
    }
  }, [open]);

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
              <ProUpgradeRoleStep
                roles={roles}
                onSelect={(r) => { setSelectedRole(r); setStep('type'); }}
                onClose={handleClose}
              />
            )}
            {step === 'type' && selectedRole && (
              <ProUpgradeTypeStep
                role={selectedRole}
                onSelect={(t) => { setSelectedType(t); setStep('submit'); }}
                onBack={() => setStep('role')}
              />
            )}
            {step === 'submit' && selectedRole && selectedType && (
              <ProUpgradeSubmitStep
                role={selectedRole}
                roleType={selectedType}
                onBack={() => setStep('type')}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            )}
            {step === 'success' && <ProUpgradeSuccessStep onClose={handleClose} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

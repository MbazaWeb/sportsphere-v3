'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';
import { AuthLogo } from '@/components/auth/AuthLogo';
import { RegistrationFanStep, type RegistrationData } from './RegistrationFanStep';
import { RegistrationSuccessStep } from './RegistrationSuccessStep';

export default function RegistrationModal() {
  const registrationOpen = useAuthStore(s => s.registrationOpen);
  const setRegistrationOpen = useAuthStore(s => s.setRegistrationOpen);
  const completeRegistration = useAuthStore(s => s.completeRegistration);
  const setActiveTab = useNavigationStore(s => s.setActiveTab);

  const [step, setStep] = useState<'fan' | 'complete'>('fan');
  const [completedName, setCompletedName] = useState('');
  const [isPendingPro, setIsPendingPro] = useState(false);
  const [completedRoleName, setCompletedRoleName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleClose = () => {
    if (submitting) return;
    setRegistrationOpen(false);
    setTimeout(() => {
      setStep('fan');
      setSubmitError('');
      setIsPendingPro(false);
      setCompletedRoleName('');
    }, 300);
  };

  const handleCompleteClose = () => {
    handleClose();
    setActiveTab('profile');
  };

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  useEffect(() => {
    const isTextInput = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === 'input') {
        const t = (el as HTMLInputElement).type.toLowerCase();
        return ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(t);
      }
      return tag === 'textarea' || el.isContentEditable;
    };
    const onFocusIn = (e: FocusEvent) => {
      if (isTextInput(e.target)) setIsKeyboardOpen(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (isTextInput(e.target)) {
        setTimeout(() => {
          if (!isTextInput(document.activeElement)) setIsKeyboardOpen(false);
        }, 0);
      }
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  if (!registrationOpen) return null;

  const handleComplete = async (d: RegistrationData) => {
    setSubmitting(true);
    setSubmitError('');
    const result = await completeRegistration({
      name: d.name, email: d.email, handle: d.handle,
      password: d.password, sports: d.sports,
      roleId: d.roleId, roleTypeId: d.roleTypeId,
    });
    setSubmitting(false);
    if (result.ok) {
      setCompletedName(d.name);
      // If a PRO role was selected, the account will be pending
      const isPro = !!d.roleId && d.selectedRole?.slug !== 'fan';
      setIsPendingPro(isPro);
      setCompletedRoleName(d.selectedRole?.name || '');
      setStep('complete');
    } else {
      setSubmitError(result.error || 'Registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl glass-card flex flex-col overflow-hidden"
        style={{
          maxHeight: isKeyboardOpen ? '85dvh' : '90dvh',
        }}
      >
        <div className="flex-1 overflow-y-auto scrollbar-hide touch-scroll p-4 sm:p-6 pb-[env(safe-area-inset-bottom)]">
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
              {step === 'fan' && <RegistrationFanStep onBack={handleClose} onComplete={handleComplete} />}
              {step === 'complete' && (
                <RegistrationSuccessStep
                  name={completedName}
                  isPending={isPendingPro}
                  roleName={completedRoleName}
                  onClose={handleCompleteClose}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

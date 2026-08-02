'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Check, RefreshCw } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { AuthLogo } from '@/components/auth/AuthLogo';
import { useAuthStore } from '@/store/authStore';

/**
 * VerifyEmailModal — Phase 4 spec: "Verify Email, OTP, Success Screen"
 * After registration, users can verify their email via a 6-digit OTP code.
 * Triggered from the ProfileTab or when the user's emailVerified is false.
 */
export default function VerifyEmailModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const userProfile = useAuthStore((s) => s.userProfile);
  const setUserProfile = useAuthStore((s) => s.setUserProfile);

  // Request OTP on mount
  const requestOTP = useCallback(async () => {
    setRequesting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email/request', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send verification code.');
      } else {
        setCooldown(60);
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setRequesting(false);
  }, []);

  useEffect(() => {
    if (open) {
      setCode('');
      setError('');
      setSuccess(false);
      requestOTP();
    }
  }, [open, requestOTP]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed.');
        setLoading(false);
        return;
      }
      // Update user profile
      if (userProfile) {
        setUserProfile({ ...userProfile, emailVerified: true });
      }
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-3xl glass-card p-6"
      >
        <AuthLogo />

        <div className="flex w-full items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Verify Email</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 shadow-[0_4px_30px_rgba(16,185,129,0.3)]">
              <Check className="h-8 w-8 text-emerald-400" strokeWidth={3} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">Email Verified!</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Your email has been verified successfully. You now have full access to all SportSphere features.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors shadow-[0_4px_20px_rgba(245,197,24,0.2)]"
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                <Mail className="h-6 w-6 text-gold" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                We sent a 6-digit verification code to{' '}
                <span className="text-white font-medium">{userProfile?.email || 'your registered email'}</span>
              </p>
            </div>

            {error && (
              <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <div className="flex justify-center mb-4">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                onComplete={() => {}}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-12 bg-surface border-surface-border text-white text-lg" />
                  <InputOTPSlot index={1} className="h-12 w-12 bg-surface border-surface-border text-white text-lg" />
                  <InputOTPSlot index={2} className="h-12 w-12 bg-surface border-surface-border text-white text-lg" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="h-12 w-12 bg-surface border-surface-border text-white text-lg" />
                  <InputOTPSlot index={4} className="h-12 w-12 bg-surface border-surface-border text-white text-lg" />
                  <InputOTPSlot index={5} className="h-12 w-12 bg-surface border-surface-border text-white text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors disabled:opacity-50 shadow-[0_4px_20px_rgba(245,197,24,0.2)]"
            >
              {loading ? 'Verifying…' : 'Verify Email'}
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive the code?{' '}
                <button
                  onClick={cooldown > 0 ? undefined : requestOTP}
                  disabled={cooldown > 0 || requesting}
                  className="text-gold hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : requesting ? 'Sending…' : 'Resend'}
                </button>
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

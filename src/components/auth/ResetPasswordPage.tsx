'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AuthLogo } from '@/components/auth/AuthLogo';
import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';

/**
 * Step 2 of the forgot-password flow.
 *
 * Renders a full-screen overlay when the URL contains `?token=…`
 * (e.g. the link the user clicked from the reset email). The user enters
 * a new password + confirmation → POST /api/auth/reset-password.
 * On success, the user is logged in automatically (the API issues a fresh
 * session cookie) and we close the overlay.
 *
 * Implementation notes:
 * - We don't need a Next.js dynamic route; we just inspect window.location.
 * - The overlay is mounted globally from `Home()`, but renders nothing
 *   unless the token query is present. This keeps the flow completely
 *   self-contained — no router changes, no layout changes.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setUserProfile = useAuthStore((s) => s.setUserProfile);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, []);

  // Clean the URL on unmount / dismiss so the overlay doesn't reappear on refresh
  const clearUrl = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    router.replace(url.pathname + (url.search ? url.search : ''));
  };

  const close = (wasSuccess = false) => {
    setToken(null);
    setPassword('');
    setConfirm('');
    setError('');
    setSuccess(false);
    setLoading(false);
    clearUrl();
    if (wasSuccess) {
      // Redirect to profile after a successful password reset (user is now logged in)
      setActiveTab('profile');
    }
  };

  const submit = async () => {
    setError('');
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to reset password.');
        setLoading(false);
        return;
      }
      // Auto-login: API returned the user + set a fresh session cookie
      setUserProfile({
        id: data.id, name: data.name, email: data.email,
        handle: data.handle, avatar: data.avatar, role: data.role,
        verificationStatus: data.verificationStatus, bio: data.bio,
        sportsFollowing: data.sportsFollowing, registeredAt: data.registeredAt || new Date().toISOString(),
        roleData: data.roleData,
      });
      setIsAuthenticated(true);
      setSuccess(true);
      // Auto-close after a short delay so the user sees the confirmation
      setTimeout(() => close(true), 1800);
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="w-full max-w-sm rounded-3xl glass-card p-6"
          >
            <AuthLogo />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {success ? 'Password Reset' : 'Set New Password'}
              </h2>
              {!success && (
                <button
                  onClick={() => close()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {success ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <p className="mb-1 text-sm text-white font-medium">Your password has been updated</p>
                <p className="text-xs text-muted-foreground">You&apos;re now signed in.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 rounded-xl bg-gold/10 border border-gold/20 p-3 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gold font-medium leading-relaxed">
                    Choose a strong password you haven&apos;t used before.
                  </p>
                </div>

                {error && (
                  <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <div className="mb-3">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">New Password</label>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="mb-5">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirm Password</label>
                  <PasswordInput
                    value={confirm}
                    onChange={setConfirm}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                  />
                </div>
                <button
                  onClick={submit}
                  disabled={loading || !password || !confirm}
                  className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

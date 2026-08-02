'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Step 1 of the forgot-password flow.
 *
 * User enters their email → POST /api/auth/forgot-password.
 * For security, the API always returns the same "if an account exists, a
 * link was sent" message regardless of whether the email exists. The reset
 * link is logged to the server console (dev mode) — in production you'd
 * send it via email (resend/nodemailer/Postmark).
 *
 * After submitting, show a success state with a "back to sign in" button.
 */
export default function ForgotPasswordModal({ open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const close = () => {
    onClose();
    // Reset state after the modal animates out
    setTimeout(() => {
      setEmail('');
      setError('');
      setDone(false);
      setLoading(false);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-sm rounded-3xl bg-surface-elevated border border-surface-border p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {done ? 'Check Your Email' : 'Reset Password'}
          </h2>
          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {done ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="mb-2 text-sm text-white font-medium">Reset link sent</p>
            <p className="mb-5 text-xs text-muted-foreground leading-relaxed">
              If an account exists for <span className="text-gold font-medium">{email}</span>,
              a password reset link has been sent. The link expires in 30 minutes.
            </p>
            <p className="mb-5 rounded-xl bg-gold/5 border border-gold/15 p-3 text-[11px] text-muted-foreground leading-relaxed text-left">
              <strong className="text-gold">Dev note:</strong> In this environment the reset link is printed
              in the server console (terminal running <code className="text-gold/80">npm run dev</code>).
              Open it to set a new password.
            </p>
            <button
              onClick={close}
              className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
              Enter your account email and we&apos;ll send you a link to reset your password.
            </p>
            {error && (
              <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full rounded-xl bg-surface border border-surface-border pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>
            <button
              onClick={submit}
              disabled={loading || !email}
              className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <button
              onClick={close}
              className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Sign In
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

'use client';
import { apiFetch } from '@/lib/api';

import React, { useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AuthLogo } from '@/components/auth/AuthLogo';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * LoginModal — standalone component extracted from page.tsx
 * Spec: Phase 4 — "Update ALL authentication screens. Add official SportSphere logo. Top centered. Consistent sizing. Responsive."
 */
export default function LoginModal() {
  const { loginModalOpen, setLoginModalOpen } = useUIStore();
  const { setRegistrationOpen } = useAuthStore();
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setUserProfile = useAuthStore((s) => s.setUserProfile);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  if (!loginModalOpen) return null;

  const handleLogin = async () => {
    setError('');
    setNotFound(false);
    setLoading(true);
    try {
      const identifier = email.trim();
      const res = await apiFetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
        redirect: 'follow',
      });
      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch {
        setError('Login service unavailable. Please try again.');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        if (data.notFound) setNotFound(true);
        else setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      // API returns { user, token, expiresAt } — never read fields from the envelope
      const u = data.user || data;
      if (!u?.id) {
        setError('Login succeeded but profile was empty. Please try again.');
        setLoading(false);
        return;
      }
      setUserProfile({
        id: u.id,
        name: u.name,
        email: u.email,
        handle: u.handle,
        avatar: u.avatar || u.avatarInitials || (u.name ? String(u.name).slice(0, 2).toUpperCase() : '?'),
        avatarUrl: u.avatarUrl || null,
        role: u.role,
        verificationStatus: u.verificationStatus,
        bio: u.bio,
        sportsFollowing: u.sportsFollowing || [],
        registeredAt: u.registeredAt || new Date().toISOString(),
        roleData: u.roleData || {},
        isVerified: u.isVerified,
        emailVerified: u.emailVerified,
        followerCount: u.followerCount ?? 0,
        followingCount: u.followingCount ?? 0,
        postCount: u.postCount ?? 0,
        location: u.location,
        coverGradient: u.coverGradient,
        coverUrl: u.coverUrl || null,
        roleId: u.roleId,
        roleTypeId: u.roleTypeId,
        typeName: u.typeName,
        isPro: u.isPro,
      });
      setIsAuthenticated(true);
      setLoginModalOpen(false);
      setEmail('');
      setPassword('');
      // Admins go straight to admin panel
      const role = (u.role || '').toLowerCase();
      if (role.includes('admin')) {
        window.location.href = '/admin';
      } else {
        setActiveTab('profile');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const openRegister = () => {
    setLoginModalOpen(false);
    setTimeout(() => setRegistrationOpen(true), 150);
  };

  const openForgot = () => {
    setLoginModalOpen(false);
    setTimeout(() => setForgotOpen(true), 150);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-3xl glass-card p-6"
        >
          <AuthLogo />

          <div className="flex w-full items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Sign In</h2>
            <button
              onClick={() => setLoginModalOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {notFound && (
            <div className="mb-3 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-xs text-blue-300 mb-2">No account found with that email or handle.</p>
              <button
                onClick={openRegister}
                className="w-full rounded-lg bg-gold py-2 text-xs font-bold text-black hover:bg-gold/90 transition-colors"
              >
                Create an Account
              </button>
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email or Handle</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="your@email.com or @handle"
              autoComplete="username"
              className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="mb-2">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-muted-foreground">Password</label>
              <button
                type="button"
                onClick={openForgot}
                className="text-[11px] text-gold hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <PasswordInput
              value={password}
              onChange={setPassword}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="mt-3 w-full rounded-xl bg-gold py-3 text-sm font-bold text-black hover:bg-gold/90 transition-colors disabled:opacity-50 shadow-[0_4px_20px_rgba(245,197,24,0.2)]"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              No account?{' '}
              <button onClick={openRegister} className="text-gold hover:underline font-medium">
                Create one
              </button>
            </p>
          </div>
        </motion.div>
      </div>
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}

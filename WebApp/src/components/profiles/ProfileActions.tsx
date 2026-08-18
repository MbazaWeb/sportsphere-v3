'use client';

import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { UserPlus, UserMinus, MessageCircle, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useState } from 'react';
import { ClaimButton } from './ClaimButton';

interface ProfileActionsProps {
  role: string;
  following: boolean;
  setFollowing: (val: boolean) => void;
  targetUserId?: string;
}

export function ProfileActions({ role, following, setFollowing, targetUserId }: ProfileActionsProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [busy, setBusy] = useState(false);

  const handleFollow = async () => {
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
    if (!targetUserId || busy) return;
    setBusy(true);
    try {
      const res = await apiFetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action: 'fan' }),
      });
      if (res.ok) {
        const data = await res.json();
        setFollowing(!!data.following);
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn('Follow failed', res.status, err);
      }
    } catch (e) {
      console.warn('Follow network error', e);
    }
    setBusy(false);
  };

  return (
    <>
    <div className="mt-3 px-3 sm:px-4 flex gap-2">
      <button onClick={handleFollow} disabled={busy}
        className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 sm:py-3 text-sm font-bold transition-all active:scale-[0.98]',
          following ? 'glass-card text-muted-foreground' : 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]',
          busy && 'opacity-50 cursor-wait')}>
        {following ? <><UserMinus className="h-4 w-4" /> You&apos;re a Fan</> : <><UserPlus className="h-4 w-4" /> Become a Fan</>}
      </button>
      <button className="flex items-center justify-center rounded-xl glass-card px-4 hover:bg-surface-elevated transition-colors active:scale-95">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </button>
      <button
        onClick={async () => {
          if (!isAuthenticated) { setLoginModalOpen(true); return; }
          if (!targetUserId || busy) return;
          setBusy(true);
          try {
            const res = await apiFetch('/api/follows', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetUserId, action: 'follow' }),
            });
            if (res.ok) { /* follow independent of fan */ }
          } catch {}
          setBusy(false);
        }}
        disabled={busy}
        className="flex items-center justify-center rounded-xl glass-card px-4 text-xs font-bold text-white"
      >
        Follow
      </button>
      {(role === 'team' || role === 'business' || role === 'stadium' || role === 'venue') && (
        <button className="relative flex items-center justify-center rounded-xl glass-card px-4 hover:bg-surface-elevated transition-colors active:scale-95">
          <ShoppingBag className="h-4 w-4 text-gold" />
        </button>
      )}
    </div>
    <ClaimButton targetUserId={targetUserId} role={role} />
    </>
  );
}

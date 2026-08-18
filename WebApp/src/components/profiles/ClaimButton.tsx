'use client';

import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const CLAIMABLE_ROLES = new Set(['team', 'player', 'coach', 'official']);

export function ClaimButton({
  targetUserId,
  role,
}: {
  targetUserId?: string;
  role?: string;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'hidden' | 'claimable' | 'pending' | 'claimed'>('hidden');

  useEffect(() => {
    if (!targetUserId || !CLAIMABLE_ROLES.has(String(role || '').toLowerCase())) {
      setStatus('hidden');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/claims?targetId=${encodeURIComponent(targetUserId)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.isClaimed) setStatus('claimed');
        else if (data.claimable) setStatus('claimable');
        else setStatus('hidden');
      } catch {
        if (!cancelled) setStatus('claimable');
      }
    })();
    return () => { cancelled = true; };
  }, [targetUserId, role]);

  if (status === 'hidden') return null;

  if (status === 'claimed') {
    return (
      <div className="px-3 sm:px-4 mt-2">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
          <BadgeCheck className="h-4 w-4" />
          Official claimed profile
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="px-3 sm:px-4 mt-2">
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">
          Claim pending admin review
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 mt-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!isAuthenticated) { setLoginModalOpen(true); return; }
          if (!targetUserId) return;
          setBusy(true);
          try {
            const res = await apiFetch('/api/claims', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetId: targetUserId }),
            });
            const data = await res.json();
            if (res.ok) setStatus('pending');
            else alert(data.error || 'Could not submit claim');
          } catch {
            alert('Network error');
          }
          setBusy(false);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 py-2.5 text-sm font-bold text-gold hover:bg-gold/20 active:scale-[0.99] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
        {busy ? 'Submitting…' : 'Claim this profile'}
      </button>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        Are you this team, player, or coach? Request to manage the page.
      </p>
    </div>
  );
}

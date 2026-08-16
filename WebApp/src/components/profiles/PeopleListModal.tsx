'use client';
import { apiFetch } from '@/lib/api';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, ShieldCheck } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { BadgeStack } from '@/components/ui/RoleBadge';

interface PeopleListModalProps {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

interface Person {
  id: string; name: string; handle: string; avatarInitials: string | null;
  avatarUrl?: string | null;
  isVerified: boolean; isPro?: boolean; role: string; bio: string | null;
}

export function PeopleListModal({ userId, type, onClose }: PeopleListModalProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/api/follows?userId=${userId}&type=${type}`);
        if (res.ok) setPeople(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [userId, type]);

  const openProfile = useCallback(async (person: Person) => {
    try {
      const res = await apiFetch(`/api/users?handle=${encodeURIComponent(person.handle)}`);
      if (res.ok) {
        const u = await res.json();
        const { apiUserToViewing } = await import('@/types');
        setViewingUser(apiUserToViewing(u, false));
        onClose();
      }
    } catch { /* ignore */ }
  }, [setViewingUser, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-surface-elevated border border-surface-border">
        <div className="flex-shrink-0 flex items-center justify-between border-b border-surface-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-bold text-white capitalize">{type}</h3>
            {!loading && <span className="text-xs text-muted-foreground">{people.length}</span>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-surface p-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-surface-border" />
                  <div className="flex-1"><div className="h-3 w-32 rounded bg-surface-border mb-2" /><div className="h-2 w-20 rounded bg-surface-border" /></div>
                </div>
              ))}
            </div>
          ) : people.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{type === 'following' ? 'Not following anyone yet.' : 'No followers yet.'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {people.map((person) => (
                <button key={person.id} onClick={() => openProfile(person)} className="flex items-center gap-3 rounded-xl bg-surface border border-surface-border p-3 text-left hover:border-gold/30 transition-colors w-full active:scale-[0.99]">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold/10 text-xs font-bold text-gold">
                    {person.avatarUrl ? (
                      <img src={person.avatarUrl} alt={person.name} className="h-full w-full object-cover" />
                    ) : (
                      person.avatarInitials || person.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white truncate">{person.name}</p>
                      {person.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">{person.handle}</p>
                      <BadgeStack role={person.role} isVerified={false} isPro={person.isPro} size="xs" />
                    </div>
                    {person.bio && <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{person.bio}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
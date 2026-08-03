'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, ShieldCheck } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

interface PeopleListModalProps {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

export function PeopleListModal({ userId, type, onClose }: PeopleListModalProps) {
  const [people, setPeople] = useState<Array<{
    id: string; name: string; handle: string; avatarInitials: string | null;
    isVerified: boolean; role: string; bio: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(/api/follows?userId=&type=);
        if (res.ok) setPeople(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [userId, type]);

  const openProfile = async (person: typeof people[number]) => {
    try {
      const res = await fetch(/api/users?handle=);
      if (res.ok) {
        const u = await res.json();
        setViewingUser({
          id: u.id, name: u.name, handle: u.handle, avatar: u.avatarInitials,
          verified: u.isVerified, coverGradient: u.coverGradient, bio: u.bio || '',
          role: u.role, location: u.location || '', joined: '',
          followers: u.followerCount, following: u.followingCount, posts: u.postCount,
          isFollowing: false,
        });
        onClose();
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-surface-elevated border border-surface-border">
        <div className="flex-shrink-0 flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h3 className="text-sm font-bold text-white capitalize">{type}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
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
                <button key={person.id} onClick={() => openProfile(person)} className="flex items-center gap-3 rounded-xl bg-surface border border-surface-border p-3 text-left hover:border-gold/30 transition-colors w-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">
                    {person.avatarInitials || person.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-white truncate">{person.name}</p>
                      {person.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{person.handle}</p>
                    {person.bio && <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{person.bio}</p>}
                  </div>
                  <span className="rounded-lg bg-surface border border-surface-border px-2 py-1 text-[10px] font-semibold text-muted-foreground capitalize">{person.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

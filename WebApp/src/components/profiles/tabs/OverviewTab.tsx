'use client';

import { BarChart3, Info, Star } from 'lucide-react';
import { formatCount } from '@/store/useAppStore';
import type { ApiUser } from '../types';
import { useState, useEffect } from 'react';

interface OverviewTabProps {
  apiUser: ApiUser | null;
  user: {
    followers: number;
    following: number;
    posts: number;
    joined: string;
  };
  role: string;
}

type Favorite = {
  id: string;
  targetType: string;
  targetName: string;
  targetHandle: string | null;
};

export function OverviewTab({ apiUser, user }: OverviewTabProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favLoading, setFavLoading] = useState(true);

  useEffect(() => {
    if (!apiUser?.id) { setFavLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/profile/favorites?userId=${apiUser.id}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setFavorites(data);
        }
      } catch { /* ignore */ }
      if (!cancelled) setFavLoading(false);
    })();
    return () => { cancelled = true; };
  }, [apiUser?.id]);

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <BarChart3 className="h-4 w-4" /> Quick Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Fans" value={formatCount(user.followers)} />
          <StatCard label="Following" value={formatCount(user.following)} />
          <StatCard label="Posts" value={formatCount(user.posts)} />
          <StatCard label="Joined" value={user.joined} />
        </div>
      </div>

      {/* Favorites Section */}
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <Star className="h-4 w-4" /> Favorites
        </h3>
        {favLoading ? (
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-7 w-24 rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-xs text-muted-foreground">No favorites yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favorites.map(f => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 rounded-xl bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold border border-gold/20"
              >
                <span>{f.targetName}</span>
                <span className="text-[9px] text-gold/60 bg-gold/5 px-1 rounded">{f.targetType}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {apiUser?.aboutMe && (
        <div className="glass-card rounded-2xl p-4 glass-card-hover">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
            <Info className="h-4 w-4" /> About
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed">{apiUser.aboutMe}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-3 text-center">
      <p className="text-sm font-bold text-gold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

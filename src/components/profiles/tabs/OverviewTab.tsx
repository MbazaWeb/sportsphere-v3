'use client';

import { BarChart3, Info } from 'lucide-react';
import { formatCount } from '@/store/useAppStore';
import type { ApiUser } from '../types';

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

export function OverviewTab({ apiUser, user }: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
          <BarChart3 className="h-4 w-4" /> Quick Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Followers" value={formatCount(user.followers)} />
          <StatCard label="Following" value={formatCount(user.following)} />
          <StatCard label="Posts" value={formatCount(user.posts)} />
          <StatCard label="Joined" value={user.joined} />
        </div>
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

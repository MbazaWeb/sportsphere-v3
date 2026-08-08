'use client';

import { BarChart3 } from 'lucide-react';
import type { ApiUser } from '../types';

interface StatsTabProps {
  role: string;
  apiUser: ApiUser | null;
}

export function StatsTab({ role, apiUser }: StatsTabProps) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, string>;
  const stats = role === 'player' ? [
    { label: 'Goals', value: rp.goals || 'N/A' }, { label: 'Assists', value: rp.assists || 'N/A' },
    { label: 'Apps', value: rp.appearances || 'N/A' }, { label: 'Position', value: rp.position || 'N/A' },
    { label: 'Height', value: rp.height || 'N/A' }, { label: 'Foot', value: rp.preferredFoot || 'N/A' },
  ] : [
    { label: 'Trophies', value: rp.trophies || 'N/A' }, { label: 'Win Rate', value: rp.winRate || 'N/A' },
    { label: 'Experience', value: rp.experience || 'N/A' }, { label: 'Formation', value: rp.formation || 'N/A' },
    { label: 'License', value: rp.license || 'N/A' }, { label: 'Team', value: rp.currentTeam || 'N/A' },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider"><BarChart3 className="h-4 w-4" /> Career Statistics</h3>
        <div className="grid grid-cols-3 gap-3">{stats.map(s => <StatCard key={s.label} {...s} />)}</div>
      </div>
      <div className="glass-card rounded-2xl p-4 glass-card-hover">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider"><BarChart3 className="h-4 w-4" /> Last 5 Matches</h3>
        <div className="flex items-center justify-center py-8"><BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">Performance data unavailable</p></div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-surface p-3 text-center"><p className="text-sm font-bold text-gold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}

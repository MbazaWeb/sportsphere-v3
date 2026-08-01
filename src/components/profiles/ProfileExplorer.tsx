'use client';

import { ALL_PROFILE_TYPES, type ProfileTypeId } from './profileConfig';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Search, ChevronRight, Users, Trophy, Flag, Star, Newspaper, BarChart3,
  Camera, ScanSearch, Scale, Building, ShieldCheck, Mic, Briefcase,
} from 'lucide-react';

interface ProfileExplorerProps { onSelectProfile: (id: ProfileTypeId) => void; }

const categoryGroups = [
  { title: 'Sports Entities', ids: ['team', 'competition', 'match', 'stadium', 'venue', 'academy'] as ProfileTypeId[] },
  { title: 'People',          ids: ['player', 'coach', 'referee', 'fan'] as ProfileTypeId[] },
  { title: 'Media & Content', ids: ['journalist', 'analyst', 'creator'] as ProfileTypeId[] },
  { title: 'Organizations',   ids: ['community', 'organization', 'business', 'scout'] as ProfileTypeId[] },
];

function getIcon(id: ProfileTypeId) {
  const map: Record<ProfileTypeId, React.ElementType> = {
    team: Users, competition: Trophy, match: Flag, stadium: Building,
    venue: Star, academy: ShieldCheck, player: Users, coach: Users,
    referee: Scale, fan: Star, journalist: Newspaper, analyst: BarChart3,
    creator: Camera, scout: ScanSearch, community: Users,
    organization: Building, business: Briefcase,
  };
  return map[id] || Star;
}

const accentMap: Partial<Record<ProfileTypeId, string>> = {
  team: 'bg-blue-500/10 text-blue-400',
  competition: 'bg-yellow-500/10 text-yellow-400',
  match: 'bg-red-500/10 text-red-400',
  player: 'bg-gold/10 text-gold',
  coach: 'bg-purple-500/10 text-purple-400',
  stadium: 'bg-cyan-500/10 text-cyan-400',
  journalist: 'bg-orange-500/10 text-orange-400',
  creator: 'bg-pink-500/10 text-pink-400',
};

export default function ProfileExplorer({ onSelectProfile }: ProfileExplorerProps) {
  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <div>
            <h1 className="text-xl font-bold text-white">Profiles</h1>
            <p className="text-xs text-muted-foreground">17 types · Unified design system</p>
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-elevated">
            <Search className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 pb-2">
        <div className="rounded-2xl bg-surface-elevated border border-surface-border p-4">
          <h2 className="mb-2 text-sm font-bold text-gold">Unified Profile Architecture</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every profile follows the same pattern. Only relevant tabs appear per role.
          </p>
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {['Overview', 'Content', 'Sports', 'Community', 'Commerce', 'About'].map((step, i) => (
              <span key={step} className="flex flex-shrink-0 items-center gap-1.5 text-[10px] font-semibold">
                <span className="rounded-md bg-gold/10 px-2 py-0.5 text-gold">{step}</span>
                {i < 5 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {categoryGroups.map((group) => (
          <section key={group.title}>
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.title}</h3>
            <div className="flex flex-col gap-2">
              {group.ids.map((id) => {
                const config = ALL_PROFILE_TYPES.find(p => p.id === id)!;
                const IconComp = getIcon(id);
                const accent = accentMap[id] || 'bg-surface text-muted-foreground';
                return (
                  <motion.button
                    key={id}
                    onClick={() => onSelectProfile(id)}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 rounded-2xl bg-surface-elevated border border-surface-border p-3 text-left transition-all hover:border-gold/20 active:opacity-80"
                  >
                    <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0', accent)}>
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{config.label}</span>
                        {config.mockData.verified && (
                          <ShieldCheck className="h-3.5 w-3.5 text-gold flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{config.mockData.name}</p>
                      <p className="text-[10px] text-muted-foreground/60">{config.tabs.length} tabs</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

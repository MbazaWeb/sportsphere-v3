'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Search, ChevronRight, Users, Trophy, Star, Newspaper, BarChart3,
  Camera, Scale, Building, ShieldCheck, Briefcase, X,
} from 'lucide-react';
import type { ProfileTypeId } from './profileConfig';
import { BadgeStack } from '@/components/ui/RoleBadge';
import { useUIStore } from '@/store/uiStore';
import { apiUserToViewing } from '@/types';

// Hook to open a user's full profile
function useUIStoreLocal() {
  return useUIStore((s) => s.setViewingUser);
}

interface ProfileExplorerProps {
  onSelectProfile?: (id: ProfileTypeId) => void;
}

interface ApiUser {
  id: string;
  name: string;
  handle: string;
  avatarInitials: string | null;
  role: string;
  isVerified: boolean;
  bio: string | null;
  location: string | null;
  followerCount: number;
  coverGradient: string;
}

const ROLE_GROUPS: { title: string; roles: string[]; icon: React.ElementType }[] = [
  { title: 'Teams & Clubs', roles: ['team'], icon: Users },
  { title: 'Players', roles: ['player'], icon: Star },
  { title: 'Coaches', roles: ['coach'], icon: Users },
  { title: 'Referees', roles: ['referee'], icon: Scale },
  { title: 'Journalists', roles: ['journalist'], icon: Newspaper },
  { title: 'Analysts', roles: ['analyst'], icon: BarChart3 },
  { title: 'Creators', roles: ['creator'], icon: Camera },
  { title: 'Scouts', roles: ['scout'], icon: Search },
  { title: 'Stadiums', roles: ['stadium'], icon: Building },
  { title: 'Academies', roles: ['academy'], icon: ShieldCheck },
  { title: 'Communities', roles: ['community'], icon: Users },
  { title: 'Organizations', roles: ['organization'], icon: Building },
  { title: 'Businesses', roles: ['business'], icon: Briefcase },
  { title: 'Venues', roles: ['venue'], icon: Star },
  { title: 'Fans', roles: ['fan'], icon: Users },
];

function getRoleIcon(role: string): React.ElementType {
  const group = ROLE_GROUPS.find(g => g.roles.includes(role));
  return group?.icon || Star;
}

function getRoleAccent(role: string): string {
  const accents: Record<string, string> = {
    team: 'bg-blue-500/10 text-blue-400',
    player: 'bg-gold/10 text-gold',
    coach: 'bg-purple-500/10 text-purple-400',
    referee: 'bg-yellow-500/10 text-yellow-400',
    journalist: 'bg-orange-500/10 text-orange-400',
    analyst: 'bg-cyan-500/10 text-cyan-400',
    creator: 'bg-pink-500/10 text-pink-400',
    scout: 'bg-green-500/10 text-green-400',
    stadium: 'bg-indigo-500/10 text-indigo-400',
    academy: 'bg-emerald-500/10 text-emerald-400',
    community: 'bg-red-500/10 text-red-400',
    organization: 'bg-blue-500/10 text-blue-400',
    business: 'bg-gray-500/10 text-gray-400',
    venue: 'bg-amber-500/10 text-amber-400',
    fan: 'bg-surface text-muted-foreground',
  };
  return accents[role] || 'bg-surface text-muted-foreground';
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function ProfileExplorer({ onSelectProfile: _onSelectProfile }: ProfileExplorerProps) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const setViewingUser = useUIStoreLocal();

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) setUsers(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    loadUsers();
  }, []);

  const filtered = users.filter(u => {
    if (activeRole && u.role !== activeRole) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return u.name.toLowerCase().includes(q) ||
             u.handle.toLowerCase().includes(q) ||
             (u.bio || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Group filtered users by role
  const grouped = ROLE_GROUPS.map(group => ({
    ...group,
    users: filtered.filter(u => group.roles.includes(u.role)),
  })).filter(g => g.users.length > 0);

  return (
    <div className="mx-auto max-w-lg">
      {/* Search bar */}
      <div className="sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams, players, coaches..."
            className="w-full rounded-xl bg-surface border border-surface-border pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Role filter chips */}
        <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveRole(null)}
            className={cn(
              'flex-shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
              !activeRole ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-white'
            )}
          >
            All
          </button>
          {ROLE_GROUPS.map(group => {
            const Icon = group.icon;
            const count = users.filter(u => group.roles.includes(u.role)).length;
            if (count === 0) return null;
            return (
              <button
                key={group.title}
                onClick={() => setActiveRole(group.roles[0])}
                className={cn(
                  'flex items-center gap-1 flex-shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
                  activeRole === group.roles[0] ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:text-white'
                )}
              >
                <Icon className="h-3 w-3" />
                {group.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-surface" />
                <div className="flex-1">
                  <div className="h-3 w-32 rounded bg-surface mb-2" />
                  <div className="h-2 w-20 rounded bg-surface" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Search className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No profiles found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try a different search or filter</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map(group => (
              <div key={group.title}>
                <div className="mb-2 flex items-center gap-2">
                  <group.icon className="h-4 w-4 text-gold" />
                  <h3 className="text-xs font-bold text-gold uppercase tracking-wider">{group.title}</h3>
                  <span className="text-[10px] text-muted-foreground">({group.users.length})</span>
                </div>
                <div className="flex flex-col gap-2">
                  {group.users.map(user => {
                    const Icon = getRoleIcon(user.role);
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          // Open the REAL user profile (with full tabs), not a generic role mockup
                          setViewingUser(apiUserToViewing(user, false));
                        }}
                        className="flex items-center gap-3 rounded-xl bg-surface-elevated border border-surface-border p-3 text-left hover:border-gold/30 transition-colors w-full group"
                      >
                        <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold', getRoleAccent(user.role))}>
                          {user.avatarInitials || user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-bold text-white truncate group-hover:text-gold transition-colors">{user.name}</p>
                            <BadgeStack role={user.role} isVerified={user.isVerified} size="xs" />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.handle}</p>
                          {user.bio && <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{user.bio}</p>}
                          {user.location && (
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-0.5">
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                              {user.location}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {user.followerCount > 0 && (
                            <span className="text-[10px] font-semibold text-gold">{formatCount(user.followerCount)}</span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-gold transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

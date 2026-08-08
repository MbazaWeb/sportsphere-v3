'use client';

import { cn } from '@/lib/utils';
import { MapPin, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import { BadgeStack } from '@/components/ui/RoleBadge';
import type { ViewingUser } from '@/types';

interface ProfileInfoProps {
  user: ViewingUser;
  role: string;
}

export function ProfileInfo({ user, role }: ProfileInfoProps) {
  return (
    <div className="relative -mt-14 px-4">
      <div className="flex items-end gap-4">
        <div className={cn('flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background text-2xl font-bold relative',
          user.verified ? 'bg-gold text-black' : 'bg-surface-elevated text-white')}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            user.avatar
          )}
          {user.verified && (
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-background">
              <ShieldCheck className="h-5 w-5 text-gold" />
            </span>
          )}
        </div>
        <div className="mb-1 flex-1 min-w-0 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-black text-white truncate">{user.name}</h1>
            {user.isPro && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-gold to-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black shadow-[0_2px_8px_rgba(245,197,24,0.25)]">
                <Sparkles className="h-2.5 w-2.5" /> Pro
              </span>
            )}
          </div>
          <div className="mt-1">
            <BadgeStack role={role} isVerified={user.verified} isPro={user.isPro} size="xs" />
          </div>
        </div>
      </div>

      {user.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/80">{user.bio}</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-sm text-muted-foreground">{user.handle}</span>
        {user.location && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 text-gold" />{user.location}
          </span>
        )}
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3 text-gold" />Joined {user.joined}
        </span>
      </div>
    </div>
  );
}

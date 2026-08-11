'use client';

import { cn } from '@/lib/utils';
import { MapPin, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import { BadgeStack } from '@/components/ui/RoleBadge';
import type { ViewingUser } from '@/types';

interface ProfileInfoProps {
  user: ViewingUser;
  role: string;
  roleData?: Record<string, unknown> | null;
}

export function ProfileInfo({ user, role, roleData }: ProfileInfoProps) {
  const mediaName = typeof roleData?.mediaName === 'string' ? roleData.mediaName : undefined;
  return (
    <div className="relative -mt-12 sm:-mt-14 px-3 sm:px-4">
      <div className="flex items-end gap-3 sm:gap-4">
        <div className={cn('flex h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] sm:border-4 border-background text-xl sm:text-2xl font-bold relative',
          user.verified ? 'bg-gold text-black' : 'bg-surface-elevated text-white')}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            user.avatar
          )}
          {user.verified && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-background border-2 border-gold">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
            </span>
          )}
        </div>
        <div className="mb-1 flex-1 min-w-0 pb-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black text-white truncate">{user.name}</h1>
            {user.isPro && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-gold to-amber-500 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-black shadow-[0_2px_8px_rgba(245,197,24,0.25)]">
                <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> Pro
              </span>
            )}
          </div>
          <div className="mt-1">
            <BadgeStack role={role} isVerified={user.verified} isPro={user.isPro} mediaName={mediaName} size="xs" />
          </div>
        </div>
      </div>

      {user.bio && <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-foreground/80 line-clamp-3">{user.bio}</p>}

      <div className="mt-2 sm:mt-3 flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1">
        <span className="text-xs sm:text-sm text-muted-foreground">{user.handle}</span>
        {user.location && (
          <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 text-gold" />{user.location}
          </span>
        )}
        {user.joined && (
          <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 text-gold" />Joined {user.joined}
          </span>
        )}
      </div>
    </div>
  );
}

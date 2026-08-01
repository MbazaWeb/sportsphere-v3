'use client';

import { type ProfileTypeConfig } from './profileConfig';
import { cn } from '@/lib/utils';
import { MapPin, Calendar, ShieldCheck, ArrowLeft, MoreHorizontal } from 'lucide-react';

interface ProfileHeaderProps {
  config: ProfileTypeConfig;
  onBack?: () => void;
  onAction?: (actionId: string) => void;
  isFollowing?: boolean;
}

export default function ProfileHeader({ config, onBack, onAction, isFollowing }: ProfileHeaderProps) {
  const { mockData, primaryActions, label } = config;

  return (
    <div className="relative">
      {onBack && (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <button onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors">
            <ArrowLeft className="h-4 w-4 text-white" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors">
            <MoreHorizontal className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      <div className={cn('relative h-40 w-full bg-gradient-to-b', mockData.coverGradient)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      <div className="relative -mt-12 px-4">
        <div className="flex items-end gap-4">
          <div className={cn(
            'relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-4 border-background text-2xl font-bold',
            mockData.verified ? 'bg-sport-green text-black' : 'bg-surface-elevated text-white'
          )}>
            {mockData.avatar}
            {mockData.verified && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-background">
                <ShieldCheck className="h-5 w-5 text-sport-green" />
              </span>
            )}
          </div>
          <div className="mb-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="truncate text-lg font-bold text-white">{mockData.name}</h1>
              <span className="flex-shrink-0 rounded-md bg-surface-elevated border border-surface-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                {label}
              </span>
            </div>
            {mockData.role && <p className="truncate text-sm text-muted-foreground">{mockData.role}</p>}
          </div>
        </div>

        {mockData.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/80">{mockData.bio}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {mockData.handle && <span className="text-sm text-muted-foreground">{mockData.handle}</span>}
          {mockData.location && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />{mockData.location}
            </span>
          )}
          {mockData.joined && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />Joined {mockData.joined}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {mockData.stats.map((stat, i) => (
            <div key={i} className="rounded-xl bg-surface-elevated border border-surface-border p-3 text-center">
              <p className="text-sm font-bold text-white">{stat.value}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          {primaryActions.map((action) => (
            <button key={action.id} onClick={() => onAction?.(action.id)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors',
                action.id === 'follow' || action.id === 'join'
                  ? isFollowing
                    ? 'bg-surface border border-surface-border text-muted-foreground hover:text-white'
                    : 'bg-sport-green text-black hover:bg-sport-green/90'
                  : action.primary
                    ? 'bg-surface border border-surface-border text-white hover:bg-surface-elevated'
                    : 'bg-surface border border-surface-border text-muted-foreground hover:text-white',
              )}>
              {action.id === 'follow' && isFollowing ? 'Following' : action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

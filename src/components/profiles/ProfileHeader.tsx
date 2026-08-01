'use client';

import { type ProfileTypeConfig } from './profileConfig';
import { cn } from '@/lib/utils';
import { MapPin, Calendar, ShieldCheck, ArrowLeft, MoreHorizontal, Trophy, Star } from 'lucide-react';

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

      <div className={cn('relative h-48 w-full bg-gradient-to-b', mockData.coverGradient)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      </div>

      <div className="relative -mt-12 px-4">
        <div className="flex items-end gap-4">
          <div className={cn(
            'relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-4 border-background text-2xl font-bold',
            mockData.verified ? 'bg-gold text-black' : 'bg-surface-elevated text-white'
          )}>
            {mockData.avatar}
            {mockData.verified && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-background">
                <ShieldCheck className="h-5 w-5 text-gold" />
              </span>
            )}
          </div>
          <div className="mb-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="truncate text-xl font-black text-white">{mockData.name}</h1>
              <span className="flex-shrink-0 rounded-md bg-gold/10 border border-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold uppercase">
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
              <MapPin className="h-3 w-3 text-gold" />{mockData.location}
            </span>
          )}
          {mockData.joined && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 text-gold" />Joined {mockData.joined}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {mockData.stats.map((stat, i) => (
            <div key={i} className="glass-card rounded-xl p-3 text-center glass-card-hover">
              <p className="text-sm font-black text-gold">{stat.value}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          {primaryActions.map((action) => (
            <button key={action.id} onClick={() => onAction?.(action.id)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all',
                action.id === 'follow' || action.id === 'join'
                  ? isFollowing
                    ? 'glass-card text-muted-foreground hover:text-white'
                    : 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)] hover:shadow-[0_6px_30px_rgba(245,197,24,0.3)]'
                  : action.primary
                    ? 'glass-card text-white hover:bg-surface-elevated'
                    : 'glass-card text-muted-foreground hover:text-white',
              )}>
              {action.id === 'follow' && isFollowing ? 'Following' : action.label}
            </button>
          ))}
        </div>

        {/* 🏆 Trophies Collection */}
        {mockData.name === 'Kylian Mbappé' || mockData.name === 'Marcus Rashford' && (
          <div className="mt-4 glass-card rounded-xl p-4 glass-card-hover">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-gold" />
              <h4 className="text-xs font-bold text-gold uppercase tracking-wider">Trophies Collection</h4>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['3x Ligue 1', '2x UEFA Euro', '1x World Cup'].map((trophy) => (
                <span key={trophy} className="rounded-lg bg-gold/10 border border-gold/20 px-3 py-1 text-xs font-semibold text-gold">
                  {trophy}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

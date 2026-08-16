'use client';

import { ArrowLeft, Heart, MapPin, Users, Trophy, Shield, User as UserIcon, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore, type ViewingEntity } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { formatCount } from '@/store/useAppStore';

const TYPE_CONFIG: Record<string, { bg: string; icon: typeof Shield; label: string; gradient: string }> = {
  TEAM: { bg: 'bg-emerald-500/20', icon: Shield, label: 'Team', gradient: 'from-emerald-600 to-emerald-900' },
  PLAYER: { bg: 'bg-blue-500/20', icon: UserIcon, label: 'Player', gradient: 'from-blue-600 to-blue-900' },
  COACH: { bg: 'bg-orange-500/20', icon: Users, label: 'Coach', gradient: 'from-orange-600 to-orange-900' },
  LEAGUE: { bg: 'bg-purple-500/20', icon: Trophy, label: 'League', gradient: 'from-purple-600 to-purple-900' },
  COMPETITION: { bg: 'bg-purple-500/20', icon: Trophy, label: 'Competition', gradient: 'from-purple-600 to-purple-900' },
  NATIONAL_TEAM: { bg: 'bg-cyan-500/20', icon: Shield, label: 'National Team', gradient: 'from-cyan-600 to-cyan-900' },
  SPORT: { bg: 'bg-pink-500/20', icon: Trophy, label: 'Sport', gradient: 'from-pink-600 to-pink-900' },
  STADIUM: { bg: 'bg-yellow-500/20', icon: Trophy, label: 'Stadium', gradient: 'from-yellow-600 to-yellow-900' },
};

export default function EntityProfileSheet() {
  const viewingEntity = useUIStore((s) => s.viewingEntity);
  const setViewingEntity = useUIStore((s) => s.setViewingEntity);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useUIStore((s) => s.setLoginModalOpen);
  const [isFan, setIsFan] = useState(false);
  const [fanCount, setFanCount] = useState(0);
  const [entityDetails, setEntityDetails] = useState<Record<string, unknown> | null>(null);

  // Reset state when entity changes
  useEffect(() => {
    if (viewingEntity) {
      setIsFan(false);
      setFanCount(0);
      setEntityDetails(null);
      loadEntityDetails(viewingEntity);
    }
  }, [viewingEntity?.id]);

  const loadEntityDetails = async (entity: ViewingEntity) => {
    try {
      let res: Response | null = null;
      switch (entity.type) {
        case 'TEAM':
        case 'NATIONAL_TEAM':
          res = await apiFetch(`/api/teams/search?q=${encodeURIComponent(entity.name)}&type=TEAM&limit=1`);
          if (res?.ok) {
            const data = await res.json();
            if (data.results?.[0]) setEntityDetails(data.results[0]);
          }
          break;
        case 'PLAYER':
          res = await apiFetch(`/api/players/search?q=${encodeURIComponent(entity.name)}&limit=1`);
          if (res?.ok) {
            const data = await res.json();
            if (data.results?.[0]) setEntityDetails(data.results[0]);
          }
          break;
        case 'LEAGUE':
        case 'COMPETITION':
          res = await apiFetch(`/api/leagues`);
          if (res?.ok) {
            const leagues = await res.json();
            const found = leagues.find((l: { id: string; name: string }) => l.id === entity.id);
            if (found) setEntityDetails(found);
          }
          break;
        default:
          break;
      }
    } catch {
      // Silently fail — show basic info from search result
    }
  };

  if (!viewingEntity) return null;

  const config = TYPE_CONFIG[viewingEntity.type] || TYPE_CONFIG.TEAM;
  const Icon = config.icon;

  const handleBecomeFan = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    setIsFan(!isFan);
    setFanCount(isFan ? Math.max(0, fanCount - 1) : fanCount + 1);
  };

  return (
    <AnimatePresence>
      {viewingEntity && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-50 bg-background overflow-y-auto"
          style={{ touchAction: 'pan-y' }}
        >
          {/* Header */}
          <div className="sticky top-0 z-[60] flex items-center gap-2 border-b border-surface-border/80 bg-background/95 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setViewingEntity(null)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-surface-border bg-surface shadow-md active:scale-95"
              aria-label="Close"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <p className="truncate text-sm font-bold text-white">{viewingEntity.name}</p>
          </div>

          {/* Cover gradient */}
          <div className={cn('h-28 bg-gradient-to-b', config.gradient)} />

          {/* Logo overlapping the cover */}
          <div className="mx-auto -mt-12 w-full max-w-lg px-4">
            <div className="flex items-end gap-4">
              <div className={cn('flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-background shadow-xl overflow-hidden', config.bg)}>
                {viewingEntity.logoUrl ? (
                  <img src={viewingEntity.logoUrl} alt={viewingEntity.name} className="h-full w-full object-cover" />
                ) : (
                  <Icon className="h-8 w-8 text-white/80" />
                )}
              </div>
              <div className="pb-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-black text-white truncate">{viewingEntity.name}</h1>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', config.bg, 'text-white')}>
                    {config.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Extra info */}
            {viewingEntity.extra && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-gold/60" />
                {viewingEntity.extra}
              </div>
            )}

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="glass-card rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Heart className="h-4 w-4 text-gold" />
                  <p className="text-base font-black text-gold">{formatCount(fanCount)}</p>
                </div>
                <p className="text-[9px] font-medium uppercase text-muted-foreground mt-0.5">Fans</p>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Star className="h-4 w-4 text-gold" />
                  <p className="text-base font-black text-gold">Active</p>
                </div>
                <p className="text-[9px] font-medium uppercase text-muted-foreground mt-0.5">Status</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleBecomeFan}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95',
                  isFan
                    ? 'bg-surface border border-surface-border text-muted-foreground'
                    : 'bg-gold text-black shadow-[0_4px_20px_rgba(245,197,24,0.2)] hover:bg-gold/90'
                )}
              >
                <Heart className={cn('h-4 w-4', isFan ? 'fill-current' : '')} />
                {isFan ? 'Following' : 'Become a Fan'}
              </button>
            </div>

            {/* Placeholder description */}
            <div className="mt-6 p-4 glass-card rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">About</p>
              <p className="text-sm text-white/80 leading-relaxed">
                {viewingEntity.type === 'TEAM' || viewingEntity.type === 'NATIONAL_TEAM'
                  ? `${viewingEntity.name} is a competitive team. Follow them to get updates on matches, scores, and news.`
                  : viewingEntity.type === 'PLAYER'
                    ? `${viewingEntity.name} is an athlete. Follow to see performance updates, match highlights, and career stats.`
                    : viewingEntity.type === 'COACH'
                      ? `${viewingEntity.name} is a coach. Follow for tactical insights, team updates, and coaching news.`
                      : `${viewingEntity.name} is a ${config.label.toLowerCase()}. Follow to get the latest updates and standings.`}
              </p>
            </div>

            {/* Entity-specific details if loaded */}
            {entityDetails && (
              <div className="mt-3 p-4 glass-card rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Details</p>
                {Object.entries(entityDetails).map(([key, value]) => {
                  if (!value || key === 'id' || key === 'logoUrl') return null;
                  if (typeof value === 'object') return null;
                  return (
                    <div key={key} className="flex justify-between py-1.5 border-b border-surface-border/50 last:border-0">
                      <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-xs font-semibold text-white">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="h-24" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

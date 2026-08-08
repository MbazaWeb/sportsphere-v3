'use client';

import { motion } from 'framer-motion';
import { X, BarChart3, Goal, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiMatch {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: number | null;
  venue: string | null;
  kickoffAt: string;
  events: { minute: number; type: string; player: string; team: string }[];
  continent: string;
  country: string;
}

interface MatchDetailModalProps {
  match: ApiMatch;
  onClose: () => void;
  onTeamClick: (name: string) => void;
  onPlayerClick: (name: string) => void;
}

export function MatchDetailModal({ match, onClose, onTeamClick, onPlayerClick }: MatchDetailModalProps) {
  const events = (match.events || []) as Array<{ minute: number; type: string; player: string; team: string }>;
  const homeGoals = events.filter(e => e.type === 'goal' && e.team === 'home');
  const awayGoals = events.filter(e => e.type === 'goal' && e.team === 'away');

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface-elevated border border-surface-border"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface-elevated px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-bold text-white">Match Details</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-elevated">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="premium-glow-border">
            <div className="rounded-[14px] bg-gradient-to-br from-emerald-700 to-green-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-white/70 tracking-wider">{match.league}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', match.status === 'live' ? 'bg-red-500 text-white' : 'bg-surface text-muted-foreground')}>
                  {match.status === 'live' ? `Live · ${match.minute}'` : match.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => onTeamClick(match.homeTeam)} className="flex flex-col items-center gap-1 flex-1 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-sm font-black text-white group-hover:border-gold transition-colors">
                    {match.homeTeam.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white text-center group-hover:text-gold">{match.homeTeam}</p>
                </button>
                <div className="text-center">
                  <p className="text-3xl font-black text-white">{match.homeScore} - {match.awayScore}</p>
                </div>
                <button onClick={() => onTeamClick(match.awayTeam)} className="flex flex-col items-center gap-1 flex-1 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-sm font-black text-white group-hover:border-gold transition-colors">
                    {match.awayTeam.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white text-center group-hover:text-gold">{match.awayTeam}</p>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface border border-surface-border p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Venue</p>
              <p className="text-sm font-semibold text-white">{match.venue || 'TBD'}</p>
            </div>
            <div className="rounded-xl bg-surface border border-surface-border p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Kick-off</p>
              <p className="text-sm font-semibold text-white">{new Date(match.kickoffAt).toLocaleString()}</p>
            </div>
          </div>

          {events.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
                <Goal className="h-3.5 w-3.5" /> Goal Scorers
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  {homeGoals.map((e, i) => (
                    <button key={i} onClick={() => onPlayerClick(e.player)} className="flex items-center gap-2 rounded-lg bg-surface p-2 text-left hover:bg-surface-elevated transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      <span className="text-xs font-semibold text-white">{e.player}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{e.minute}'</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {awayGoals.map((e, i) => (
                    <button key={i} onClick={() => onPlayerClick(e.player)} className="flex items-center gap-2 rounded-lg bg-surface p-2 text-right hover:bg-surface-elevated transition-colors justify-end">
                      <span className="text-[10px] text-muted-foreground">{e.minute}'</span>
                      <span className="text-xs font-semibold text-white">{e.player}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
              <BarChart3 className="h-3.5 w-3.5" /> Match Stats
            </h3>
            {events.length > 0 ? (
              <div className="flex flex-col gap-2 text-sm text-muted-foreground text-center py-4">
                <p>Real-time stats are loading from the match API...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p>No match stats available yet.</p>
              </div>
            )}
          </div>

          {events.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5" /> Timeline
              </h3>
              <div className="flex flex-col gap-1">
                {events.sort((a, b) => a.minute - b.minute).map((e, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-surface p-2">
                    <span className="text-[10px] font-bold text-gold w-8">{e.minute}'</span>
                    <span className="text-xs text-white">{e.type === 'goal' ? '⚽' : e.type} {e.player} ({e.team === 'home' ? match.homeTeam : match.awayTeam})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

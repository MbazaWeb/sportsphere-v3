'use client';

import { useState } from 'react';
import { Send, Trophy, Users, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type Confidence = 'low' | 'medium' | 'high';

interface PredictionCreatorProps {
  onCreate: (
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
    confidence: Confidence
  ) => void;
  submitting: boolean;
}

const CONFIDENCE_OPTIONS: { id: Confidence; label: string; color: string; pct: string }[] = [
  { id: 'low',    label: 'Low',    color: 'text-orange-400 border-orange-500/30 bg-orange-500/10',   pct: '25%' },
  { id: 'medium', label: 'Medium', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', pct: '50%' },
  { id: 'high',   label: 'High',   color: 'text-green-400 border-green-500/30 bg-green-500/10',    pct: '85%' },
];

export function PredictionCreator({ onCreate, submitting }: PredictionCreatorProps) {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [confidence, setConfidence] = useState<Confidence>('medium');

  const hScore = parseInt(homeScore, 10);
  const aScore = parseInt(awayScore, 10);
  const isValid = homeTeam.trim() && awayTeam.trim() &&
                  homeScore !== '' && awayScore !== '' &&
                  !isNaN(hScore) && !isNaN(aScore);

  const handleSubmit = () => {
    if (!isValid) return;
    onCreate(homeTeam.trim(), awayTeam.trim(), hScore, aScore, confidence);
    setHomeTeam(''); setAwayTeam(''); setHomeScore(''); setAwayScore('');
    setConfidence('medium');
  };

  const resultLabel = (() => {
    if (!isValid) return null;
    if (hScore > aScore) return `${homeTeam} wins`;
    if (aScore > hScore) return `${awayTeam} wins`;
    return 'Draw';
  })();

  return (
    <div className="flex flex-col gap-4">
      {/* Teams */}
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Home Team</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              placeholder="e.g. Manchester United"
              maxLength={50}
              className="w-full rounded-xl bg-surface border border-surface-border pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Away Team</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              placeholder="e.g. Liverpool"
              maxLength={50}
              className="w-full rounded-xl bg-surface border border-surface-border pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Score */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Predicted Score</label>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <input
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="0"
            type="text"
            inputMode="numeric"
            className="w-full rounded-xl bg-surface border border-surface-border px-4 py-4 text-center text-2xl font-black text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <span className="text-xl font-black text-muted-foreground">-</span>
          <input
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="0"
            type="text"
            inputMode="numeric"
            className="w-full rounded-xl bg-surface border border-surface-border px-4 py-4 text-center text-2xl font-black text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      {/* Confidence */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Target className="h-3.5 w-3.5" />
          Confidence
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CONFIDENCE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setConfidence(opt.id)}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-xs font-bold transition-all',
                confidence === opt.id
                  ? opt.color + ' scale-[1.02]'
                  : 'bg-surface border-surface-border text-muted-foreground hover:text-white'
              )}
            >
              {opt.label}
              <span className="mt-0.5 block text-[10px] font-normal opacity-70">{opt.pct}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live preview */}
      {isValid && resultLabel && (
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gold/80 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Your Prediction
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 text-center">
              <p className="text-sm font-bold text-white truncate">{homeTeam}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-surface px-3 py-1.5 text-2xl font-black text-gold">{hScore}</span>
              <span className="text-muted-foreground">-</span>
              <span className="rounded-lg bg-surface px-3 py-1.5 text-2xl font-black text-gold">{aScore}</span>
            </div>
            <div className="flex-1 text-center">
              <p className="text-sm font-bold text-white truncate">{awayTeam}</p>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            <Trophy className="mr-1 inline h-3 w-3 text-gold" />
            {resultLabel} · {CONFIDENCE_OPTIONS.find(c => c.id === confidence)?.label} confidence
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors',
          isValid && !submitting
            ? 'bg-gold text-black hover:bg-gold/90 shadow-[0_4px_20px_rgba(245,197,24,0.2)]'
            : 'bg-surface text-muted-foreground cursor-not-allowed'
        )}
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Prediction
          </>
        )}
      </button>
    </div>
  );
}

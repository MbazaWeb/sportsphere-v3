'use client';

import { useState } from 'react';
import { Send, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PredictionCreatorProps {
  onCreate: (homeTeam: string, awayTeam: string, homeScore: number, awayScore: number) => void;
  submitting: boolean;
}

export function PredictionCreator({ onCreate, submitting }: PredictionCreatorProps) {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  const handleSubmit = () => {
    if (!homeTeam.trim() || !awayTeam.trim()) return;
    const hScore = parseInt(homeScore);
    const aScore = parseInt(awayScore);
    if (isNaN(hScore) || isNaN(aScore)) return;
    onCreate(homeTeam.trim(), awayTeam.trim(), hScore, aScore);
    setHomeTeam('');
    setAwayTeam('');
    setHomeScore('');
    setAwayScore('');
  };

  const isValid = homeTeam.trim() && awayTeam.trim() && 
                  homeScore !== '' && awayScore !== '' &&
                  !isNaN(parseInt(homeScore)) && !isNaN(parseInt(awayScore));

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
            Home Team
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              placeholder="e.g. Manchester United"
              className="w-full rounded-xl bg-surface border border-surface-border pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
            Away Team
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              placeholder="e.g. Liverpool"
              className="w-full rounded-xl bg-surface border border-surface-border pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Home Score
            </label>
            <input
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              type="text"
              inputMode="numeric"
              className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-center text-lg font-bold text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Away Score
            </label>
            <input
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              type="text"
              inputMode="numeric"
              className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-center text-lg font-bold text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-gold/5 border border-gold/10 p-3 mt-2">
          <Trophy className="h-4 w-4 text-gold flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Predict the final score. Your prediction will be shared with the community.
          </p>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors mt-2',
          isValid && !submitting
            ? 'bg-gold text-black hover:bg-gold/90'
            : 'bg-surface text-muted-foreground cursor-not-allowed'
        )}
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Submitting...
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

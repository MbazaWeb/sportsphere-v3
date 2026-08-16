export interface PlayerStats {
  matchesPlayed: number;
  goalsPoints: number;
  assists: number;
  savesOrBlocks?: number;
}

export interface CalculatedRank {
  ppiScore: number;
  efficiencyRate: number;
  tier: string;
  tierColor: string;
}

export function calculatePlayerPerformance(stats: PlayerStats): CalculatedRank {
  const { matchesPlayed, goalsPoints, assists, savesOrBlocks = 0 } = stats;

  if (!matchesPlayed || matchesPlayed === 0) {
    return { ppiScore: 0, efficiencyRate: 0, tier: 'Unranked', tierColor: 'text-slate-400 border-slate-700 bg-slate-800/50' };
  }

  // 1. Efficiency Rate (Goals + Assists per Match)
  const efficiencyRate = Number((((goalsPoints + assists) / matchesPlayed) * 100).toFixed(1));

  // 2. Composite Performance Index Score (0 - 100 Scale)
  const weightedPoints = (goalsPoints * 2.2) + (assists * 1.4) + (savesOrBlocks * 1.1);
  const rawScore = (weightedPoints / matchesPlayed) * 35;
  const ppiScore = Number(Math.min(99.9, Math.max(10, rawScore)).toFixed(1));

  // 3. Assign Tier Badge
  let tier = 'Bronze';
  let tierColor = 'text-amber-600 border-amber-600/30 bg-amber-500/10';

  if (ppiScore >= 90) {
    tier = 'World Class (S+)';
    tierColor = 'text-amber-300 border-amber-400/50 bg-amber-400/10 shadow-amber-500/20';
  } else if (ppiScore >= 80) {
    tier = 'Elite (A)';
    tierColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
  } else if (ppiScore >= 70) {
    tier = 'Pro (B)';
    tierColor = 'text-blue-400 border-blue-500/50 bg-blue-500/10';
  } else if (ppiScore >= 50) {
    tier = 'Silver (C)';
    tierColor = 'text-slate-300 border-slate-400/50 bg-slate-400/10';
  }

  return { ppiScore, efficiencyRate, tier, tierColor };
}

export interface TeamHistory {
  teamName: string;
  startDate: string;
  endDate: string;
  duration: string;
  isCurrent?: boolean;
}

export interface SpotlightItem {
  id: string;
  type: 'video' | 'image' | 'reel';
  title: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  createdAt: string;
  likesCount: number;
  commentsCount?: number;
  sharesCount?: number;
  audioTrack?: string;
}

export interface PlayerProfile {
  id: string;
  fullName: string;
  photoUrl: string;
  dateOfBirth: string;
  nationality: string;
  heightCm: number;
  weightKg: number;
  sport: string;
  position: string;
  jerseyNumber: number;
  currentTeam: string;
  dominantSide: string;
  yearsExperience: number;
  matchesPlayed: number;
  goalsPoints: number;
  assists: number;
  ppiScore: number;
  efficiencyRate: number;
  globalRank: number;
  categoryRank: number;
  percentileTier: string;
  achievements: string[];
  skills: string[];
  injuryHistory: Array<{ injury: string; year: number; recoveryTime: string }>;
  coachName: string;
  careerHistory: TeamHistory[];
  spotlights?: SpotlightItem[];
  biography: string;
}

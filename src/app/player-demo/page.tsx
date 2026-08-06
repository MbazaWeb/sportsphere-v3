import React from 'react';
import PlayerProfileCard from '@/components/PlayerProfileCard';
import { PlayerProfile } from '@/types/player';

const mockPlayer: PlayerProfile = {
  id: 'mbappe-7',
  fullName: 'Kylian Mbappé',
  photoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
  dateOfBirth: '1998-12-20',
  nationality: 'French',
  heightCm: 178,
  weightKg: 75,
  sport: 'Football',
  position: 'Forward',
  jerseyNumber: 9,
  currentTeam: 'Real Madrid CF',
  dominantSide: 'Right',
  yearsExperience: 9,
  matchesPlayed: 200,
  goalsPoints: 178,
  assists: 62,
  ppiScore: 94.5,
  efficiencyRate: 89.0,
  globalRank: 1,
  categoryRank: 1,
  percentileTier: 'World Class (S+)',
  careerHistory: [
    { teamName: 'Real Madrid CF', startDate: 'Jul 2024', endDate: 'Present', duration: '1 yr 1 mo', isCurrent: true },
    { teamName: 'Paris Saint-Germain', startDate: 'Aug 2017', endDate: 'Jun 2024', duration: '6 yrs 10 mos' },
    { teamName: 'AS Monaco', startDate: 'Dec 2015', endDate: 'Aug 2017', duration: '1 yr 8 mos' },
  ],
  spotlights: [
    {
      id: 'spot-1',
      type: 'video',
      title: 'Solo Goal Highlights vs Barcelona',
      thumbnailUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80',
      caption: 'Full-court sprint finish from counter attack.',
      createdAt: '2 days ago',
      likesCount: 1420,
    },
    {
      id: 'spot-2',
      type: 'image',
      title: 'Training Session Ahead of UCL Quarterfinal',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=400&q=80',
      caption: 'Final prep done with coach Carlo Ancelotti.',
      createdAt: '1 week ago',
      likesCount: 980,
    },
  ],
  achievements: [
    'FIFA World Cup Winner (2018)',
    'FIFA World Cup Golden Boot (2022)',
    '5x Ligue 1 Top Scorer',
    'UEFA Nations League Champion (2021)',
  ],
  skills: ['Pace & Acceleration', 'Clinical Finishing', 'Dribbling', 'Counter-Attack Execution'],
  injuryHistory: [],
  coachName: 'Carlo Ancelotti',
  biography:
    'Explosive forward known for world-class acceleration, precise dribbling, and elite goalscoring ability at both club and international levels.',
};

export default function PlayerDemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-300">SportSphere Player Insights</h1>
        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
          Live PPI Engine v2.0
        </span>
      </div>
      <PlayerProfileCard player={mockPlayer} />
    </main>
  );
}

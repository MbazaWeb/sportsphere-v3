import React from 'react';
import db from '@/lib/db';
import PlayerProfileCard from '@/components/PlayerProfileCard';
import { PlayerProfile } from '@/types/player';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPlayerFromDb(playerId: string): Promise<PlayerProfile | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: playerId },
      include: { playerProfile: true },
    });

    if (!user || !user.playerProfile) return null;
    const p = user.playerProfile;

    return {
      id: user.id,
      fullName: user.name || user.username || 'Unknown',
      photoUrl: user.avatarUrl || '/default-avatar.png',
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
      nationality: p.nationality || 'N/A',
      heightCm: p.height || 0,
      weightKg: p.weight || 0,
      sport: 'Football',
      position: p.position || 'Athlete',
      jerseyNumber: parseInt(p.jerseyNumber || '0') || 0,
      currentTeam: p.currentClub || 'Free Agent',
      dominantSide: p.preferredFoot || 'Right',
      yearsExperience: 0,
      matchesPlayed: p.appearances || 0,
      goalsPoints: p.goals || 0,
      assists: p.assists || 0,
      ppiScore: p.rating || 0,
      efficiencyRate: p.savePct || p.passAccuracy || 0,
      globalRank: p.ranking ? parseInt(p.ranking) || 0 : 0,
      categoryRank: 0,
      percentileTier: p.form || 'Unranked',
      achievements: p.strengths ?? [],
      skills: p.strengths ?? [],
      injuryHistory: [],
      coachName: 'N/A',
      careerHistory: [
        {
          teamName: p.currentClub || 'Current Club',
          startDate: 'Jan 2025',
          endDate: 'Present',
          duration: '1 yr 7 mos',
          isCurrent: true,
        },
      ],
      spotlights: [
        {
          id: 'spot-1',
          type: 'video',
          title: 'Season Highlight Reel',
          thumbnailUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80',
          caption: 'Key plays and match goals from current campaign.',
          createdAt: '3 days ago',
          likesCount: 340,
        },
      ],
      biography: p.playingStyle || 'No biography details recorded yet.',
    };
  } catch (error) {
    console.error('Database query failed:', error);
    return null;
  }
}

export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params;
  const player = await getPlayerFromDb(id);

  if (!player) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between">
      <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between max-w-2xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-italic italic text-white">
            Sport<span className="text-[#FBBF24]">Sphere</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-slate-300 hover:text-white border border-slate-700/60 text-xs">🔍</button>
          <button className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-slate-300 hover:text-white border border-slate-700/60 text-xs relative">
            🛍️
            <span className="absolute -top-1 -right-1 bg-[#FBBF24] text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">0</span>
          </button>
          <button className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-slate-300 hover:text-white border border-slate-700/60 text-xs">✉️</button>
          <button className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-slate-300 hover:text-white border border-slate-700/60 text-xs">🔔</button>
        </div>
      </header>

      <main className="flex-1 py-6 pb-24">
        <PlayerProfileCard player={player} />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800/80 py-2.5 px-6">
        <div className="max-w-md mx-auto flex justify-between items-center text-center">
          <Link href="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white">
            <span className="text-base">🏠</span>
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/scores" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white">
            <span className="text-base">🏆</span>
            <span className="text-[10px] font-medium">Scores</span>
          </Link>
          <Link href="/create" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white">
            <div className="w-7 h-7 rounded-full bg-[#1E293B] border border-slate-700 flex items-center justify-center text-slate-300 text-xs">➕</div>
            <span className="text-[10px] font-medium">Create</span>
          </Link>
          <Link href="/activity" className="flex flex-col items-center gap-1 text-slate-400 hover:text-white">
            <span className="text-base">🔔</span>
            <span className="text-[10px] font-medium">Activity</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 text-[#FBBF24]">
            <span className="text-base">👤</span>
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

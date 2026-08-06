import React from 'react';
import Image from 'next/image';
import { PlayerProfile } from '@/types/player';

export default function PlayerProfileCard({ player }: { player: PlayerProfile }) {
  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 text-slate-100 font-sans px-2">
      {/* Profile Header Card */}
      <div className="bg-[#161F30] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-800">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#FBBF24] bg-slate-900 flex-shrink-0">
            {player.photoUrl ? (
              <Image
                src={player.photoUrl}
                alt={player.fullName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xl">
                {player.fullName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">{player.fullName}</h1>
              <span className="bg-[#FBBF24]/10 text-[#FBBF24] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#FBBF24]/30">
                #{player.jerseyNumber}
              </span>
            </div>
            <p className="text-slate-300 text-sm font-medium">
              {player.position} <span className="text-slate-500">•</span> {player.currentTeam}
            </p>
            <p className="text-xs text-slate-400">Coach: {player.coachName}</p>
          </div>
        </div>

        {/* Stat Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800">
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Matches</span>
            <span className="text-xl font-extrabold text-white">{player.matchesPlayed}</span>
          </div>
          <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800">
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Goals / Pts</span>
            <span className="text-xl font-extrabold text-[#FBBF24]">{player.goalsPoints}</span>
          </div>
          <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800">
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Assists</span>
            <span className="text-xl font-extrabold text-[#FBBF24]">{player.assists}</span>
          </div>
          <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800">
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Experience</span>
            <span className="text-xl font-extrabold text-[#FBBF24]">{player.yearsExperience} yrs</span>
          </div>
        </div>
      </div>

      {/* Bio Attributes & Key Skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#161F30] p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FBBF24]" />
            <h3 className="text-xs font-bold text-[#FBBF24] uppercase tracking-wider">Bio Attributes</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">Age</span>
              <span className="font-medium text-white">{calculateAge(player.dateOfBirth)} ({player.dateOfBirth})</span>
            </li>
            <li className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">Nationality</span>
              <span className="font-medium text-white">{player.nationality}</span>
            </li>
            <li className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">Height / Weight</span>
              <span className="font-medium text-white">{player.heightCm} cm / {player.weightKg} kg</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-400">Dominant Side</span>
              <span className="font-medium text-white">{player.dominantSide}</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#161F30] p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FBBF24]" />
            <h3 className="text-xs font-bold text-[#FBBF24] uppercase tracking-wider">Key Skills & Badges</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {player.skills.map((skill, i) => (
              <span key={i} className="bg-[#0F172A] text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-800 font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Teams Played */}
      <div className="bg-[#161F30] p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FBBF24]" />
          <h3 className="text-xs font-bold text-[#FBBF24] uppercase tracking-wider">Teams Played</h3>
        </div>
        <div className="space-y-2">
          {player.careerHistory.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-[#0F172A] p-3 rounded-xl border border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{item.teamName}</span>
                  {item.isCurrent && (
                    <span className="text-[10px] bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/40 px-2 py-0.5 rounded-full font-bold">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {item.startDate} — {item.endDate}
                </p>
              </div>
              <span className="text-xs font-bold text-[#FBBF24] bg-[#161F30] px-3 py-1 rounded-lg border border-slate-800">
                {item.duration}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Biography & Achievements */}
      <div className="bg-[#161F30] p-5 rounded-2xl border border-slate-800 space-y-4">
        {player.biography && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FBBF24]" />
              <h3 className="text-xs font-bold text-[#FBBF24] uppercase tracking-wider">Biography</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-4">{player.biography}</p>
          </div>
        )}

        {player.achievements && player.achievements.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FBBF24]" />
              <h3 className="text-xs font-bold text-[#FBBF24] uppercase tracking-wider">Achievements</h3>
            </div>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-4">
              {player.achievements.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Spotlights Feed (Generic header for Videos, Posts, Images) */}
      {player.spotlights && player.spotlights.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="px-1">
            <h3 className="text-base font-bold text-white tracking-tight">Spotlights</h3>
          </div>

          <div className="space-y-4">
            {player.spotlights.map((item) => (
              <div
                key={item.id}
                className="bg-[#23272F]/90 rounded-2xl p-4 border border-slate-800/80 space-y-3 shadow-md"
              >
                <h4 className="font-bold text-sm text-white px-1">{item.title}</h4>
                
                <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video border border-slate-800">
                  {item.mediaUrl ? (
                    <video
                      controls
                      poster={item.thumbnailUrl}
                      className="w-full h-full object-cover"
                    >
                      <source src={item.mediaUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="relative w-full h-full">
                      <Image
                        src={item.thumbnailUrl || '/default-avatar.png'}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#FBBF24] text-black flex items-center justify-center font-bold text-lg pl-0.5 shadow-lg">
                          ▶
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 px-1 pt-1">
                  <span className="flex items-center gap-1 hover:text-white cursor-pointer">
                    ♡ {item.likesCount}
                  </span>
                  <span className="flex items-center gap-1 hover:text-white cursor-pointer">
                    💬 {item.commentsCount || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';

const ROLES = [
  { id: 'fan', title: 'Fan', icon: '⚽', desc: 'Follow sports, join communities, and share sports highlights.' },
  { id: 'player', title: 'Player / Athlete', icon: '🏃', desc: 'Build your sports career profile, stats, and connect with scouts.' },
  { id: 'coach', title: 'Coach / Manager', icon: '📋', desc: 'Manage teams, post tactics, and discover new talent.' },
  { id: 'scout', title: 'Scout / Agent', icon: '🔍', desc: 'Track player statistics and identify rising talent.' },
  { id: 'journalist', title: 'Journalist / Creator', icon: '🎙️', desc: 'Publish sports news, media content, and match analysis.' },
];

export function RegistrationRoleStep({ onSelectRole }: { onSelectRole: (roleId: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400 text-center mb-2">Step 1 of 3: Choose your primary role</p>
      {ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onSelectRole(r.id)}
          className="w-full flex items-start gap-3 rounded-xl bg-zinc-800/80 p-3.5 text-left border border-zinc-700/60 transition-all hover:bg-zinc-800 hover:border-amber-400/80 group"
        >
          <span className="text-2xl p-1 bg-zinc-900 rounded-lg">{r.icon}</span>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white group-hover:text-amber-400">{r.title}</h4>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{r.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default RegistrationRoleStep;

'use client';

import React, { useState, useEffect } from 'react';

interface SportItem {
  id: string;
  name: string;
}

const FALLBACK_SPORTS: SportItem[] = [
  { id: 'football', name: 'Football (Soccer)' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'rugby', name: 'Rugby' },
  { id: 'motorsport', name: 'Motorsport / F1' },
  { id: 'athletics', name: 'Athletics' },
  { id: 'boxing', name: 'Boxing / MMA' },
];

export default function RegisterModal({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sportsList, setSportsList] = useState<SportItem[]>(FALLBACK_SPORTS);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchSports() {
      try {
        const res = await fetch('/sportsphere/api/sports');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSportsList(data.map((s: any) => ({ id: s.id || s.slug, name: s.name })));
          }
        }
      } catch (e) {
        // Fallback options remain active if API fetch fails
      }
    }
    fetchSports();
  }, []);

  const toggleSport = (sportId: string) => {
    if (selectedSports.includes(sportId)) {
      setSelectedSports(selectedSports.filter((id) => id !== sportId));
    } else {
      setSelectedSports([...selectedSports, sportId]);
    }
  };

  const removeSport = (sportId: string) => {
    setSelectedSports(selectedSports.filter((id) => id !== sportId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 p-6 text-white shadow-2xl border border-zinc-800">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
          >
            ✕
          </button>
        )}

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Sport<span className="text-amber-400">Sphere</span>
          </h2>
          <h3 className="mt-2 text-xl font-bold">Join SportSphere</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Create your fan account and start following your favorite sports. You can upgrade to other roles later.
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Simba fan"
              className="mt-1 w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="simbafan@gmail.com"
              className="mt-1 w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300">Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@simbafan"
              className="mt-1 w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300">Password (min 8 chars)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Multi-Select Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold text-zinc-300">
              Sports you follow <span className="text-amber-400">*</span>
            </label>

            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="mt-1 min-h-[46px] w-full cursor-pointer rounded-xl bg-zinc-800 p-2.5 border border-zinc-700 flex flex-wrap items-center gap-1.5 focus:outline-none"
            >
              {selectedSports.length === 0 ? (
                <span className="text-sm text-zinc-500">Select sports...</span>
              ) : (
                selectedSports.map((id) => {
                  const sport = sportsList.find((s) => s.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-400/30"
                    >
                      {sport?.name || id}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSport(id);
                        }}
                        className="hover:text-amber-200"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })
              )}
              <span className="ml-auto text-xs text-zinc-400">{dropdownOpen ? '▲' : '▼'}</span>
            </div>

            {dropdownOpen && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl bg-zinc-800 py-1 shadow-xl border border-zinc-700">
                {sportsList.map((sport) => {
                  const isSelected = selectedSports.includes(sport.id);
                  return (
                    <div
                      key={sport.id}
                      onClick={() => toggleSport(sport.id)}
                      className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        isSelected ? 'bg-amber-400/10 text-amber-400 font-semibold' : 'text-zinc-300 hover:bg-zinc-700/50'
                      }`}
                    >
                      <span>{sport.name}</span>
                      {isSelected && <span>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-sm font-bold text-black shadow-lg transition-transform hover:bg-amber-300 active:scale-[0.98]"
          >
            <span>✨</span> Create Fan Account
          </button>
        </form>
      </div>
    </div>
  );
}

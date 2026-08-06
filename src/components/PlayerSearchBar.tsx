'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  full_name: string;
  photo_url: string;
  position: string;
  current_team: string;
  ppi_score: number;
}

export default function PlayerSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.players || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search players by name, team, position..."
        className="w-full bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-400 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 shadow-md"
      />
      
      {loading && (
        <span className="absolute right-4 top-3 text-xs text-slate-400">Searching...</span>
      )}

      {results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800">
          {results.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              onClick={() => setQuery('')}
              className="flex items-center justify-between p-3 hover:bg-slate-800/80 transition"
            >
              <div>
                <p className="font-semibold text-white text-sm">{player.full_name}</p>
                <p className="text-xs text-slate-400">{player.position} • {player.current_team}</p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-bold border border-emerald-500/20">
                PPI {player.ppi_score}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

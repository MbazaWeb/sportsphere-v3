'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';
import Link from 'next/link';

export default function TeamsPage() {
  const [q, setQ] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function load(search = q) {
    setLoading(true);
    const res = await adminFetch(`/api/admin/teams?q=${encodeURIComponent(search)}`);
    const data = await res.json();
    setTeams(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(''); }, []);

  return (
    <div className="p-6 text-slate-100">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Teams</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search Simba, Yanga..."
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
          <button onClick={() => load()} className="rounded-lg bg-slate-800 px-3 py-2 text-sm">Search</button>
          <button
            className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-black"
            onClick={async () => {
              const res = await adminFetch('/api/admin/teams/seed', { method: 'POST' });
              const data = await res.json();
              setMsg(`Seeded ${data.seeded || 0} teams`);
              load('');
            }}
          >
            Seed TZ teams
          </button>
        </div>
      </div>
      {msg && <p className="mb-3 text-sm text-emerald-400">{msg}</p>}
      {loading ? <p>Loading…</p> : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="p-2 text-left">Team</th>
                <th className="p-2 text-left">City</th>
                <th className="p-2 text-left">Slug</th>
                <th className="p-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id} className="border-t border-slate-800">
                  <td className="p-2 font-semibold">{t.name}</td>
                  <td className="p-2">{t.city || '—'}</td>
                  <td className="p-2 text-slate-400">{t.slug}</td>
                  <td className="p-2">
                    <Link className="text-amber-400" href={`/dashboard/teams/${t.id}`}>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!teams.length && <p className="p-4 text-slate-500">No teams. Click Seed TZ teams.</p>}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface PerformanceEvent {
  id: string;
  userId: string;
  eventType: string;
  value: number;
  competition: string | null;
  matchDate: string;
  pointsCalculated: number;
  verificationStatus: string;
  notes: string | null;
  user: {
    id: string;
    name: string;
    handle: string;
    role: string;
  };
}

export default function PerformanceVerificationsPage() {
  const [events, setEvents] = useState<PerformanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/performance/events?status=${tab}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(eventId: string, action: 'approve' | 'reject') {
    const notes = notesMap[eventId] || '';
    if (action === 'reject' && !notes.trim()) {
      alert('Please provide a reason for rejection in the notes.');
      return;
    }

    setProcessingId(eventId);
    try {
      const res = await adminFetch('/api/admin/performance/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, action, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      // Remove from list
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setNotesMap(prev => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">📊 Performance Verifications</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review and verify match events submitted by players and coaches.
          Verification adds points to their profile and triggers ranking updates.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-800">
        {(['pending', 'verified', 'rejected'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 transition-colors ${
              tab === t ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-slate-500 rounded-xl border border-slate-800 bg-[#0f141c]">
            No {tab} events found.
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="rounded-xl border border-slate-800 bg-[#0f141c] p-5">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xl">
                    {getEmojiForType(event.eventType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{event.user.name}</span>
                      <span className="text-xs text-slate-500">@{event.user.handle}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-bold text-slate-400">{event.user.role}</span>
                    </div>
                    <div className="text-sm text-slate-300 mt-1">
                      <span className="font-semibold text-amber-400">{event.value} {event.eventType}</span>
                      {event.competition && <span className="text-slate-500"> in {event.competition}</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Match Date: {new Date(event.matchDate).toLocaleDateString()} · ID: {event.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-emerald-400">+{event.pointsCalculated}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Est. Points</div>
                </div>
              </div>

              {tab === 'pending' && (
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Review notes..."
                    value={notesMap[event.id] || ''}
                    onChange={e => setNotesMap(prev => ({ ...prev, [event.id]: e.target.value }))}
                    className="flex-1 rounded-lg bg-[#0b0e14] border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                  />
                  <button
                    onClick={() => handleAction(event.id, 'approve')}
                    disabled={!!processingId}
                    className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleAction(event.id, 'reject')}
                    disabled={!!processingId}
                    className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-bold uppercase hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}

              {event.notes && tab !== 'pending' && (
                <div className="mt-3 p-2 rounded bg-[#0b0e14] border border-slate-800 text-xs text-slate-400">
                  <span className="font-bold text-slate-500 uppercase mr-2">Admin Note:</span>
                  {event.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getEmojiForType(type: string): string {
  const map: Record<string, string> = {
    goal: '⚽', assist: '🎯', save: '🧤', 'clean-sheet': '🛡️',
    motm: '🏅', 'match-win': '✅', 'yellow-card': '🟨', 'red-card': '🟥'
  };
  return map[type] || '📈';
}

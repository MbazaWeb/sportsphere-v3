'use client';

import React, { useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean, count?: number, error?: string } | null>(null);

  async function handleBroadcast() {
    if (!title.trim() || !body.trim()) {
      alert('Title and body are required.');
      return;
    }

    if (!confirm(`Are you sure you want to send this notification to ${role ? `all ${role}s` : 'ALL users'}?`)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await adminFetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, role }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, count: data.sentCount });
        setTitle('');
        setBody('');
      } else {
        setResult({ error: data.error || 'Failed to send broadcast.' });
      }
    } catch (err) {
      setResult({ error: 'Network error.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">📣 Admin Broadcast</h1>
        <p className="text-sm text-slate-400 mt-1">
          Send a push notification and system activity item to all users or a specific role group.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Target Audience
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg bg-[#0b0e14] border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
          >
            <option value="">All Users</option>
            <option value="fan">Fans Only</option>
            <option value="player">Players Only</option>
            <option value="coach">Coaches Only</option>
            <option value="team">Teams Only</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Notification Title
          </label>
          <input
            type="text"
            placeholder="e.g. System Maintenance"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-[#0b0e14] border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Message Body
          </label>
          <textarea
            placeholder="Write your message here..."
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg bg-[#0b0e14] border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
          />
        </div>

        {result && (
          <div className={`p-4 rounded-lg text-sm ${result.success ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-200' : 'bg-red-500/10 border border-red-500/40 text-red-200'}`}>
            {result.success ? `✓ Successfully sent to ${result.count} users.` : `✕ Error: ${result.error}`}
          </div>
        )}

        <button
          onClick={handleBroadcast}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-amber-400 text-slate-900 font-bold uppercase tracking-wider hover:bg-amber-300 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sending...' : '🚀 Send Broadcast'}
        </button>
      </div>

      <div className="mt-8 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300">
        <strong>Note:</strong> Broadcasts are logged in the Audit Log. Please use responsibly to avoid spamming users.
      </div>
    </div>
  );
}

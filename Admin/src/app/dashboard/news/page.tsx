'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  body: string;
  category: string;
  tags: any;
  status: string;
  source: string;
  createdByAI: boolean;
  imageUrl?: string | null;
  imageOwnerName?: string | null;
  imageOwnerUrl?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  sport?: { id: string; name: string; icon: string } | null;
  league?: { id: string; name: string } | null;
  team?: { id: string; name: string } | null;
  player?: { id: string; name: string } | null;
  coach?: { id: string; name: string } | null;
}

interface NewsEditorState {
  id?: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  tags: string;
  imageUrl: string;
  imageOwnerName: string;
  imageOwnerUrl: string;
  status: string;
  sportId: string;
  leagueId: string;
  teamId: string;
  playerId: string;
  coachId: string;
}

const EMPTY_EDITOR: NewsEditorState = {
  title: '',
  summary: '',
  body: '',
  category: 'general',
  tags: '',
  imageUrl: '',
  imageOwnerName: '',
  imageOwnerUrl: '',
  status: 'draft',
  sportId: '',
  leagueId: '',
  teamId: '',
  playerId: '',
  coachId: '',
};

const CATEGORIES = [
  'general',
  'transfer',
  'match_report',
  'rumor',
  'injury',
  'analysis',
];

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: 'DRAFT', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
    published: { label: 'PUBLISHED', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    archived: { label: 'ARCHIVED', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  };
  const cfg = map[status] || { label: status, color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function categoryBadge(category: string) {
  const map: Record<string, string> = {
    general: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    transfer: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    match_report: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    rumor: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    injury: 'bg-red-500/15 text-red-300 border-red-500/30',
    analysis: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };
  const color = map[category] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
      {category.replace('_', ' ')}
    </span>
  );
}

function sourceBadge(source: string, createdByAI: boolean) {
  if (createdByAI || source === 'ai') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/15 text-amber-300 border-amber-500/30">
        🤖 AI
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border bg-sky-500/15 text-sky-300 border-sky-500/30">
      ✍ Manual
    </span>
  );
}

export default function NewsManagerPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'ai' | 'manual'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<NewsEditorState>(EMPTY_EDITOR);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('createdByAI', sourceFilter === 'ai' ? 'true' : 'false');
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const res = await fetch(`/api/admin/news?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to load news');
        setNews([]);
        setTotal(0);
      } else {
        setNews(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error('News load error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, sourceFilter, categoryFilter]);

  // Read URL params on mount (e.g. ?createdByAI=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('createdByAI') === 'true') setSourceFilter('ai');
      if (params.get('status')) setStatusFilter(params.get('status')!);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditor(EMPTY_EDITOR);
    setEditorError(null);
    setEditorOpen(true);
  }

  function openEdit(item: NewsItem) {
    setEditor({
      id: item.id,
      title: item.title || '',
      summary: item.summary || '',
      body: item.body || '',
      category: item.category || 'general',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      imageUrl: item.imageUrl || '',
      imageOwnerName: item.imageOwnerName || '',
      imageOwnerUrl: item.imageOwnerUrl || '',
      status: item.status || 'draft',
      sportId: item.sport?.id || '',
      leagueId: item.league?.id || '',
      teamId: item.team?.id || '',
      playerId: item.player?.id || '',
      coachId: item.coach?.id || '',
    });
    setEditorError(null);
    setEditorOpen(true);
  }

  async function save() {
    setSaving(true);
    setEditorError(null);
    try {
      const payload: any = {
        title: editor.title.trim(),
        body: editor.body.trim(),
        summary: editor.summary.trim() || undefined,
        category: editor.category,
        tags: editor.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        imageUrl: editor.imageUrl || undefined,
        imageOwnerName: editor.imageOwnerName || undefined,
        imageOwnerUrl: editor.imageOwnerUrl || undefined,
        status: editor.status,
        sportId: editor.sportId || undefined,
        leagueId: editor.leagueId || undefined,
        teamId: editor.teamId || undefined,
        playerId: editor.playerId || undefined,
        coachId: editor.coachId || undefined,
      };

      if (!payload.title || !payload.body) {
        setEditorError('Title and body are required.');
        setSaving(false);
        return;
      }

      const isEdit = !!editor.id;
      const url = isEdit ? `/api/admin/news/${editor.id}` : '/api/admin/news';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditorError(json?.error || 'Save failed');
      } else {
        setEditorOpen(false);
        await load();
      }
    } catch (err) {
      console.error('Save error:', err);
      setEditorError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function quickPublish(item: NewsItem) {
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || 'Failed to publish');
      } else {
        await load();
      }
    } catch (err) {
      alert('Network error');
    }
  }

  async function quickUnpublish(item: NewsItem) {
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || 'Failed to unpublish');
      } else {
        await load();
      }
    } catch (err) {
      alert('Network error');
    }
  }

  async function remove(item: NewsItem) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || 'Failed to delete');
      } else {
        await load();
      }
    } catch (err) {
      alert('Network error');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const filteredNews = search
    ? news.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          (n.summary || '').toLowerCase().includes(search.toLowerCase())
      )
    : news;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">📰 News Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, edit, and publish news articles. AI-generated drafts show an amber badge.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 text-slate-900 hover:bg-amber-300 text-sm font-bold"
        >
          ✚ New Article
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search news…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-[#0f141c] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-400/50 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0f141c] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
        >
          <option value="all">All status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as any)}
          className="bg-[#0f141c] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
        >
          <option value="all">All sources</option>
          <option value="ai">AI-generated</option>
          <option value="manual">Manual</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#0f141c] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading news…</div>
        ) : error ? (
          <div className="p-12 text-center text-red-300 text-sm">⚠ {error}</div>
        ) : filteredNews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No news articles found. Click "New Article" to create one, or run the AI news generator.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#0b0e14] text-slate-500 uppercase tracking-wider">
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 font-semibold">Title</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-left px-4 py-3 font-semibold">Source</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Image Attribution</th>
                  <th className="text-left px-4 py-3 font-semibold">Created</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNews.map((n) => (
                  <tr key={n.id} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                    <td className="px-4 py-3 max-w-md">
                      <div className="text-slate-200 font-medium truncate">{n.title}</div>
                      {n.summary && (
                        <div className="text-slate-500 text-[11px] truncate mt-0.5">{n.summary}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{categoryBadge(n.category)}</td>
                    <td className="px-4 py-3">{sourceBadge(n.source, n.createdByAI)}</td>
                    <td className="px-4 py-3">{statusBadge(n.status)}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {n.imageOwnerName ? (
                        <span>{n.imageOwnerName}</span>
                      ) : n.imageUrl ? (
                        <span className="text-amber-400">No attribution</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{timeAgo(n.createdAt)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {n.createdByAI && n.status === 'draft' && (
                        <button
                          onClick={() => quickPublish(n)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 mr-3"
                        >
                          Review & Publish
                        </button>
                      )}
                      {n.status === 'published' && (
                        <button
                          onClick={() => quickUnpublish(n)}
                          className="text-xs text-slate-400 hover:text-slate-200 mr-3"
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(n)}
                        className="text-xs text-amber-400 hover:text-amber-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(n)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
            <div>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="px-2 tabular-nums">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {editor.id ? 'Edit Article' : 'New Article'}
              </h2>
              <button
                onClick={() => setEditorOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {editorError && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                ⚠ {editorError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editor.title}
                  onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Summary
                </label>
                <input
                  type="text"
                  value={editor.summary}
                  onChange={(e) => setEditor({ ...editor, summary: e.target.value })}
                  placeholder="One-line summary (optional)"
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Body *
                </label>
                <textarea
                  rows={8}
                  value={editor.body}
                  onChange={(e) => setEditor({ ...editor, body: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={editor.category}
                  onChange={(e) => setEditor({ ...editor, category: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={editor.status}
                  onChange={(e) => setEditor({ ...editor, status: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editor.tags}
                  onChange={(e) => setEditor({ ...editor, tags: e.target.value })}
                  placeholder="transfer, premier-league, arsenal"
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={editor.imageUrl}
                  onChange={(e) => setEditor({ ...editor, imageUrl: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Image Owner Name
                </label>
                <input
                  type="text"
                  value={editor.imageOwnerName}
                  onChange={(e) => setEditor({ ...editor, imageOwnerName: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Image Owner URL
                </label>
                <input
                  type="text"
                  value={editor.imageOwnerUrl}
                  onChange={(e) => setEditor({ ...editor, imageOwnerUrl: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Sport ID (optional)
                </label>
                <input
                  type="text"
                  value={editor.sportId}
                  onChange={(e) => setEditor({ ...editor, sportId: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  League ID (optional)
                </label>
                <input
                  type="text"
                  value={editor.leagueId}
                  onChange={(e) => setEditor({ ...editor, leagueId: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Team ID (optional)
                </label>
                <input
                  type="text"
                  value={editor.teamId}
                  onChange={(e) => setEditor({ ...editor, teamId: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Player ID (optional)
                </label>
                <input
                  type="text"
                  value={editor.playerId}
                  onChange={(e) => setEditor({ ...editor, playerId: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Coach ID (optional)
                </label>
                <input
                  type="text"
                  value={editor.coachId}
                  onChange={(e) => setEditor({ ...editor, coachId: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditorOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-amber-400 text-slate-900 hover:bg-amber-300 text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'Saving…' : editor.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

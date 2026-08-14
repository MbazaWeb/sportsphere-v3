'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface ModPost {
  id: string;
  content: string;
  postType: string;
  mediaUrls: any;
  teamTag: string | null;
  playerTag: string | null;
  isBreaking: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string | null;
    avatarInitials: string | null;
    isVerified: boolean;
    currentCountry: string | null;
  };
  _count: { likes: number; comments: number };
}

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

function controversyBadge(likes: number, comments: number): { label: string; color: string; bg: string } {
  const score = comments / (likes + 1);
  if (score > 2) return { label: 'HIGH', color: 'text-red-300', bg: 'bg-red-500/15 border-red-500/30' };
  if (score > 1) return { label: 'MED', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30' };
  return { label: 'LOW', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' };
}

export default function ModerationPage() {
  const [posts, setPosts] = useState<ModPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState('controversial');
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('sort', sort);
      params.set('type', type);
      if (q) params.set('q', q);
      const res = await adminFetch(`/api/admin/moderation?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to load moderation queue.');
        setPosts([]);
      } else {
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      }
    } catch (err) {
      console.error('Moderation load error:', err);
      setError('Network error.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [sort, type, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function deletePost(post: ModPost) {
    if (!confirm(`Delete this post by ${post.user.name}?\n\n"${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}"\n\nThis cannot be undone.`)) return;
    setDeletingId(post.id);
    try {
      const res = await adminFetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || 'Failed to delete post.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">⚡ Moderation Queue</h1>
        <p className="text-sm text-slate-400 mt-1">
          Content surfaced for moderator review. Sorted by controversy (comments-to-likes
          ratio), engagement, or recency. Delete spam or abusive content with audit logging.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search post content…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 rounded-lg bg-[#0f141c] border border-slate-700 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg bg-[#0f141c] border border-slate-700 px-4 py-2.5 text-sm text-slate-100"
        >
          <option value="controversial">Sort: Controversial</option>
          <option value="engagement">Sort: Engagement</option>
          <option value="recent">Sort: Most Recent</option>
          <option value="reported">Sort: Reported (falls back to controversial)</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg bg-[#0f141c] border border-slate-700 px-4 py-2.5 text-sm text-slate-100"
        >
          <option value="all">All Types</option>
          <option value="post">Posts</option>
          <option value="prediction">Predictions</option>
          <option value="poll">Polls</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          ⚠ {error}
        </div>
      )}

      {/* Queue */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-[#0f141c] p-4">
              <div className="skeleton h-5 w-32 mb-2" />
              <div className="skeleton h-4 w-full mb-1" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-12 text-center text-slate-500">
            No posts match these filters.
          </div>
        ) : (
          posts.map((p) => {
            const badge = controversyBadge(p._count.likes, p._count.comments);
            return (
              <div
                key={p.id}
                className="rounded-xl border border-slate-800 bg-[#0f141c] p-4 hover:border-slate-700 transition-colors"
              >
                {/* Author row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-slate-900 overflow-hidden">
                      {p.user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.user.avatarUrl} alt={p.user.name} className="w-full h-full object-cover" />
                      ) : (
                        p.user.avatarInitials || p.user.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                        {p.user.name}
                        {p.user.isVerified && <span className="text-emerald-400 text-xs">✓</span>}
                        {p.isBreaking && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 rounded">Breaking</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        @{p.user.handle} · {p.user.currentCountry || 'Unknown'} · {timeAgo(p.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${badge.bg} border ${badge.color} text-[10px] font-bold uppercase tracking-wider`}>
                      {badge.label} Controversy
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{p.postType}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="text-sm text-slate-200 mb-3 whitespace-pre-wrap line-clamp-4">
                  {p.content}
                </div>

                {/* Stats + Actions */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>❤️ {p._count.likes}</span>
                    <span>💬 {p._count.comments}</span>
                    <span>🔄 {p.shareCount}</span>
                    <span>👁 {p.viewCount}</span>
                    {(p.teamTag || p.playerTag) && (
                      <span className="text-amber-400">
                        🏷 {p.teamTag || p.playerTag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`${process.env.NEXT_PUBLIC_MAIN_APP_URL || '#'}/post/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-500/15 border border-slate-500/40 text-slate-300 hover:bg-slate-500/25"
                    >
                      ↗ View
                    </a>
                    <button
                      onClick={() => deletePost(p)}
                      disabled={deletingId === p.id}
                      className="px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                    >
                      {deletingId === p.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && posts.length > 0 && (
        <div className="mt-4 text-xs text-slate-500">
          Showing {posts.length} post{posts.length === 1 ? '' : 's'} · sorted by {sort}.
        </div>
      )}
    </div>
  );
}

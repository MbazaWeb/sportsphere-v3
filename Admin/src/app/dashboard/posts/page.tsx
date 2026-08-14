'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface PostItem {
  id: string;
  authorName?: string;
  authorHandle?: string;
  content?: string;
  createdAt?: string;
  likeCount?: number;
  commentCount?: number;
  isFlagged?: boolean;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/posts?limit=50', {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to load posts.');
        setPosts([]);
      } else {
        setPosts(Array.isArray(data) ? data : data.posts || []);
      }
    } catch (err) {
      console.error('Posts load error:', err);
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(post: PostItem) {
    if (!confirm('Delete this post permanently? This cannot be undone.')) {
      return;
    }
    setDeletingId(post.id);
    try {
      const res = await adminFetch(`/api/admin/posts/${post.id}`, {
        method: 'DELETE',
      });
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
        <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review the latest posts across the platform. Delete reported or
          policy-violating content.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          ⚠ {error}
        </div>
      )}

      <div className="grid gap-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-800 bg-[#0f141c] p-4"
            >
              <div className="skeleton h-5 w-1/3 mb-3" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-lg font-semibold text-slate-200">
              No posts to moderate
            </div>
            <p className="text-sm text-slate-400 mt-1">
              The fan app's /api/admin/posts endpoint returned an empty list.
            </p>
          </div>
        ) : (
          posts.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-800 bg-[#0f141c] p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-slate-100">
                      {p.authorName || 'Unknown'}
                    </span>
                    {p.authorHandle && (
                      <span className="text-xs text-slate-500">
                        {p.authorHandle}
                      </span>
                    )}
                    {p.isFlagged && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-semibold uppercase">
                        Flagged
                      </span>
                    )}
                    {p.createdAt && (
                      <span className="text-xs text-slate-500 ml-auto">
                        {new Date(p.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {p.content && (
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                      {p.content.length > 500
                        ? p.content.slice(0, 500) + '…'
                        : p.content}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>❤️ {p.likeCount ?? 0}</span>
                    <span>💬 {p.commentCount ?? 0}</span>
                  </div>
                </div>
                <button
                  onClick={() => remove(p)}
                  disabled={deletingId === p.id}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-semibold uppercase tracking-wider hover:bg-red-500/25 transition-colors disabled:opacity-50"
                >
                  {deletingId === p.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

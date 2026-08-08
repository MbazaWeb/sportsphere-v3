"use client";
import { apiFetch } from '@/lib/api';
import React, { useEffect, useState } from "react";

interface PostItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    username: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchPosts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);

    apiFetch(`/api/admin/posts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load posts:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await apiFetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Content Moderation</h1>
        <p className="text-sm text-slate-400 mt-1">Inspect feeds, search post contents, and remove policy violations.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-2 max-w-lg">
        <input
          type="text"
          placeholder="Search post content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchPosts()}
          className="flex-1 bg-[#0f141c] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
        />
        <button
          onClick={fetchPosts}
          className="bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-amber-300 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Posts Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#141b26] text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4">Likes / Comments</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading posts...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No posts found.
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                      <div>{p.user?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">@{p.user?.username}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-md truncate">
                      {p.content}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                      ❤️ {p._count?.likes || 0} &bull; 💬 {p._count?.comments || 0}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs px-3 py-1.5 rounded-md font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Plus, Sparkles, Filter, RefreshCw, FileText, CheckCircle2, Clock, Tag } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  source: 'ai-generated' | 'manual';
  createdAt: string;
}

export default function NewsManagerPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isAi, setIsAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/news');
      const data = await res.json();
      if (data.ok) setArticles(data.articles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category, isAiGenerated: isAi }),
      });
      const data = await res.json();
      if (data.ok) {
        setTitle('');
        setContent('');
        setIsModalOpen(false);
        fetchNews();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredArticles = articles.filter((a) => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchSource = sourceFilter === 'all' || a.source === sourceFilter;
    const matchCat = categoryFilter === 'all' || a.category === categoryFilter;
    return matchStatus && matchSource && matchCat;
  });

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-[#0b0e14] min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-7 h-7 text-amber-400" />
            <h1 className="text-3xl font-black text-white tracking-tight">News Manager</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Create, edit, and publish news articles. AI-generated drafts show an amber badge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNews}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Sources</option>
            <option value="ai-generated">AI-generated</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="transfer">Transfer</option>
            <option value="match report">Match Report</option>
            <option value="rumor">Rumor</option>
            <option value="injury">Injury</option>
            <option value="analysis">Analysis</option>
          </select>
        </div>
      </div>

      {/* Article Grid */}
      {filteredArticles.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800/60 rounded-2xl space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No articles match the current filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-base text-white line-clamp-2">{article.title}</h3>
                {article.source === 'ai-generated' && (
                  <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs pt-2 border-t border-slate-800/60">
                <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md font-medium capitalize flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-400" />
                  {article.category}
                </span>

                <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                  article.status === 'published' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {article.status}
                </span>

                <span className="text-slate-500 text-[11px] ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(article.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Article Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg space-y-4"
            >
              <h2 className="text-xl font-extrabold text-white">Create News Article</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Headline..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="general">General</option>
                      <option value="transfer">Transfer</option>
                      <option value="match report">Match Report</option>
                      <option value="rumor">Rumor</option>
                      <option value="injury">Injury</option>
                      <option value="analysis">Analysis</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                      <input
                        type="checkbox"
                        checked={isAi}
                        onChange={(e) => setIsAi(e.target.checked)}
                        className="rounded accent-amber-400 w-4 h-4"
                      />
                      <span>Mark as AI Draft</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Content Body</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Article story body..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    {submitting ? 'Publishing...' : 'Save Article'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

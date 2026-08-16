'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, Sparkles, RefreshCw, ArrowRight, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

interface Rumor {
  id: string;
  player: string;
  fromClub: string;
  toClub: string;
  credibility: number;
  status: 'draft' | 'published' | 'debunked' | 'archived';
  source: 'ai-generated' | 'manual';
  createdAt: string;
}

export default function RumorsManagerPage() {
  const [rumors, setRumors] = useState<Rumor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form inputs
  const [player, setPlayer] = useState('');
  const [fromClub, setFromClub] = useState('');
  const [toClub, setToClub] = useState('');
  const [credibility, setCredibility] = useState(40);
  const [isAi, setIsAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRumors = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/rumors');
      const data = await res.json();
      if (data.ok) setRumors(data.rumors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRumors();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player.trim() || !toClub.trim()) return;
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/rumors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player,
          fromClub,
          toClub,
          credibility,
          isAiGenerated: isAi,
          status: 'PUBLISHED',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPlayer('');
        setFromClub('');
        setToClub('');
        setIsModalOpen(false);
        fetchRumors();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRumors = rumors.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchSource = sourceFilter === 'all' || r.source === sourceFilter;
    return matchStatus && matchSource;
  });

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-[#0b0e14] min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-7 h-7 text-amber-400" />
            <h1 className="text-3xl font-black text-white tracking-tight">Rumors Manager</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage transfer rumors and gossip. AI rumors ship with low credibility until verified.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRumors}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Rumor</span>
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
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
            <option value="debunked">Debunked</option>
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
      </div>

      {/* Rumors Cards Grid */}
      {filteredRumors.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800/60 rounded-2xl space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No transfer rumors found matching selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRumors.map((rumor, idx) => (
            <motion.div
              key={rumor.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-lg text-white">{rumor.player}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="font-medium text-slate-300">{rumor.fromClub || 'Free Agent'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-amber-400">{rumor.toClub}</span>
                  </div>
                </div>

                {rumor.source === 'ai-generated' && (
                  <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                )}
              </div>

              {/* Credibility Meter */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Credibility Index</span>
                  <span className={`font-bold ${
                    rumor.credibility > 60 ? 'text-emerald-400' : rumor.credibility > 35 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {rumor.credibility}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      rumor.credibility > 60 ? 'bg-emerald-400' : rumor.credibility > 35 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${rumor.credibility}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 text-slate-500">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  rumor.status === 'debunked' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  {rumor.status}
                </span>
                <span>{new Date(rumor.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Rumor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4"
            >
              <h2 className="text-xl font-extrabold text-white">Post Transfer Rumor</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Player Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Victor Osimhen"
                    value={player}
                    onChange={(e) => setPlayer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">From Club</label>
                    <input
                      type="text"
                      placeholder="e.g. Napoli"
                      value={fromClub}
                      onChange={(e) => setFromClub(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Target Club</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chelsea"
                      value={toClub}
                      onChange={(e) => setToClub(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Credibility Score ({credibility}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={credibility}
                    onChange={(e) => setCredibility(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div className="flex items-center pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={isAi}
                      onChange={(e) => setIsAi(e.target.checked)}
                      className="rounded accent-amber-400 w-4 h-4"
                    />
                    <span>Mark as AI Gossip Source</span>
                  </label>
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
                    {submitting ? 'Posting...' : 'Publish Rumor'}
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

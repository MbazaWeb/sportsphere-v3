'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, Eye, EyeOff, Users, Hash, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

interface SportItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  isActive: boolean;
  userCount: number;
}

export default function SportsManagerPage() {
  const [sports, setSports] = useState<SportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('⚽');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchSports = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/sports');
      const data = await res.json();
      if (data.ok) {
        setSports(data.sports);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const res = await adminFetch('/api/admin/sports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentState }),
      });
      if (res.ok) {
        setSports((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isActive: !currentState } : s))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/sports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, icon: formIcon }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage('Sport added successfully!');
        setFormName('');
        setIsModalOpen(false);
        fetchSports();
      } else {
        setMessage(data.error || 'Failed to add sport');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-[#0b0e14] min-h-screen font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            <h1 className="text-3xl font-black text-white tracking-tight">Sports Manager</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Configure available sports categories, toggle active status, and track fan enrollment metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSports}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Sport</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}

      {/* Grid List of Sports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sports.map((sport, idx) => (
          <motion.div
            key={sport.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`p-5 rounded-2xl border transition-all ${
              sport.isActive
                ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                : 'bg-slate-950/40 border-slate-900 opacity-60'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                  {sport.icon}
                </span>
                <div>
                  <h3 className="font-bold text-lg text-white">{sport.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">/{sport.slug}</span>
                </div>
              </div>

              <button
                onClick={() => handleToggleActive(sport.id, sport.isActive)}
                className={`p-2 rounded-xl border transition ${
                  sport.isActive
                    ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/60'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title={sport.isActive ? 'Hide from Fan App' : 'Enable on Fan App'}
              >
                {sport.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/60 flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold bg-cyan-950/40 border border-cyan-900/60 px-3 py-1 rounded-full">
                <Users className="w-3.5 h-3.5" />
                <span>{sport.userCount} Fans Enrolled</span>
              </div>
              <span className={`font-bold ${sport.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                {sport.isActive ? 'ACTIVE' : 'HIDDEN'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Sport Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4"
            >
              <h2 className="text-xl font-extrabold text-white">Add New Sport Category</h2>
              <form onSubmit={handleAddSport} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Sport Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Formula 1"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Icon Emoji</label>
                  <input
                    type="text"
                    required
                    placeholder="🏎️"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                  >
                    {submitting ? 'Creating...' : 'Create Sport'}
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

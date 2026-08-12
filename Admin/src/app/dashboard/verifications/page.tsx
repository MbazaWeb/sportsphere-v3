'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ShieldCheck, RefreshCw, UserCheck, Search } from 'lucide-react';

interface VerificationItem {
  id: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    handle: string;
    role: string;
  };
  matchDetails: string;
}

export default function PerformanceVerificationsPage() {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verifications');
      const data = await res.json();
      if (data.ok) {
        setItems(data.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'verified' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesTab = item.status === activeTab;
    const matchesSearch =
      item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.handle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-[#0b0e14] min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <h1 className="text-3xl font-black text-white tracking-tight">Performance Verifications</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Review and verify match events submitted by players and coaches. Verification adds points to their profile and triggers ranking updates.
          </p>
        </div>

        <button
          onClick={fetchVerifications}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          {(['pending', 'verified', 'rejected'] as const).map((tab) => {
            const count = items.filter((i) => i.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold capitalize transition flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search athlete or coach..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Content List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800/60 rounded-2xl space-y-3">
          <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm font-medium">No {activeTab} verification requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">{item.user.name}</h3>
                  <span className="text-xs text-amber-400 font-mono">@{item.user.handle}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold uppercase">
                    {item.user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{item.matchDetails}</p>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                  <Clock className="w-3 h-3" />
                  <span>Submitted on {new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {item.status === 'pending' && (
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'rejected')}
                    className="flex-1 md:flex-none px-4 py-2 bg-red-950/40 border border-red-800/80 hover:bg-red-900/60 text-red-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(item.id, 'verified')}
                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/10"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Verify</span>
                  </button>
                </div>
              )}

              {item.status !== 'pending' && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${
                    item.status === 'verified'
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400'
                      : 'bg-red-950/50 border-red-800 text-red-400'
                  }`}
                >
                  {item.status}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}

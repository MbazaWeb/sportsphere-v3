'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, RefreshCw, CheckCircle2, XCircle, HelpCircle, User, Award, Shield, Flag } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

interface Claim {
  id: string;
  profileType: 'player' | 'coach' | 'team' | 'league';
  profileName: string;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs info';
  createdAt: string;
}

export default function ClaimsQueuePage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/claims');
      const data = await res.json();
      if (data.ok) setClaims(data.claims);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await adminFetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setClaims((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: status as any } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = claims.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchType = typeFilter === 'all' || c.profileType === typeFilter;
    return matchStatus && matchType;
  });

  const getCount = (st: string) => claims.filter((c) => c.status === st).length;

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-[#0b0e14] min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
            <h1 className="text-3xl font-black text-white tracking-tight">Claims Queue</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Review profile claims from real players, coaches, teams, and leagues.
          </p>
        </div>

        <button
          onClick={fetchClaims}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', key: 'pending', color: 'text-amber-400' },
          { label: 'Approved', key: 'approved', color: 'text-emerald-400' },
          { label: 'Rejected', key: 'rejected', color: 'text-red-400' },
          { label: 'Needs Info', key: 'needs info', color: 'text-cyan-400' },
        ].map((item) => (
          <div key={item.key} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400">{item.label}</span>
            <div className={`text-2xl font-black mt-1 ${item.color}`}>{getCount(item.key)}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs info">Needs Info</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Profile Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Profile Types</option>
            <option value="player">Player</option>
            <option value="coach">Coach</option>
            <option value="team">Team</option>
            <option value="league">League</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800/60 rounded-2xl space-y-3">
          <Shield className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No profile claims match the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((claim) => (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">{claim.profileName}</h3>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold uppercase">
                    {claim.profileType}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Claimed by <span className="text-slate-200 font-semibold">{claim.submittedBy}</span></p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(claim.id, 'approved')}
                  className="px-3 py-1.5 bg-emerald-950 border border-emerald-800 text-emerald-400 hover:bg-emerald-900 text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus(claim.id, 'rejected')}
                  className="px-3 py-1.5 bg-red-950 border border-red-800 text-red-400 hover:bg-red-900 text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}

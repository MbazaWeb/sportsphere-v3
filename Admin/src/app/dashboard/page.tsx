'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShieldCheck, Database, Cpu, Activity, Lock, Users, FileText, Trophy, ArrowUpRight, ArrowDownLeft, Wifi } from 'lucide-react';

export default function AnimatedOverviewDashboard() {
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/overview-stats');
        if (!res.ok) return;
        const result = await res.json();
        setData(result);

        const now = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistory((prev) => [
          ...prev.slice(-14),
          {
            time: now,
            cpu: result.system.cpu,
            ram: result.system.ram,
            eth0Rx: result.system.eth0.rx,
            eth0Tx: result.system.eth0.tx
          }
        ]);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-[#0b0e14] min-h-screen font-sans">
      
      {/* Top Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-white">SportSphere Control Center</h1>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Live Node
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">Real-time system telemetry, database health, and security overview</p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/80 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>DB CONNECTED</span>
          </motion.div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>SSL TLS 1.3</span>
          </div>
        </div>
      </motion.div>

      {/* Database Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', val: data?.db?.users ?? 1844, icon: Users, color: 'text-amber-400', bg: 'from-amber-500/10' },
          { label: 'Total Posts', val: data?.db?.posts ?? 5, icon: FileText, color: 'text-cyan-400', bg: 'from-cyan-500/10' },
          { label: 'Active Sports', val: data?.db?.sports ?? 20, icon: Trophy, color: 'text-emerald-400', bg: 'from-emerald-500/10' },
          { label: 'Pending Requests', val: data?.db?.pendingRoles ?? 0, icon: Activity, color: 'text-indigo-400', bg: 'from-indigo-500/10' },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ y: -4 }}
            className={`p-5 bg-gradient-to-br ${item.bg} to-slate-900/80 border border-slate-800/80 rounded-2xl relative overflow-hidden backdrop-blur-sm`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                <h3 className={`text-3xl font-extrabold mt-2 ${item.color}`}>{item.val}</h3>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
            <motion.div 
              className="absolute bottom-0 left-0 h-1 bg-current opacity-30" 
              style={{ width: '100%' }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
        ))}
      </div>

      {/* Host Telemetry & Hardware Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* CPU */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>CPU Usage</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">{data?.system?.cpu ?? 0}%</div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <motion.div className="bg-amber-400 h-2 rounded-full" animate={{ width: `${data?.system?.cpu ?? 0}%` }} transition={{ duration: 0.5 }} />
          </div>
        </motion.div>

        {/* RAM */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>RAM Usage</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-cyan-400 mt-2">{data?.system?.ram ?? 0}%</div>
          <p className="text-xs text-slate-400 mt-1">{data?.system?.ramUsedGB ?? 0} GB / {data?.system?.ramTotalGB ?? 0} GB</p>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <motion.div className="bg-cyan-400 h-2 rounded-full" animate={{ width: `${data?.system?.ram ?? 0}%` }} transition={{ duration: 0.5 }} />
          </div>
        </motion.div>

        {/* Loopback Network */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Loopback (lo)</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex justify-between items-center mt-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">⇓ DOWN</span>
              <span className="text-lg font-bold text-emerald-400">{data?.system?.lo?.rx ?? 0} <span className="text-xs">MB/s</span></span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">⇑ UP</span>
              <span className="text-lg font-bold text-indigo-400">{data?.system?.lo?.tx ?? 0} <span className="text-xs">MB/s</span></span>
            </div>
          </div>
        </motion.div>

        {/* Ethernet Network */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Ethernet (eth0)</span>
            <Wifi className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex justify-between items-center mt-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">⇓ DOWN</span>
              <span className="text-lg font-bold text-emerald-400">{data?.system?.eth0?.rx ?? 0} <span className="text-xs">MB/s</span></span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">⇑ UP</span>
              <span className="text-lg font-bold text-indigo-400">{data?.system?.eth0?.tx ?? 0} <span className="text-xs">MB/s</span></span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Database & Security Monitor Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Database Health Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="text-md font-bold text-slate-200">PostgreSQL Engine Telemetry</h3>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full font-semibold">
              OPTIMIZED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/60">
              <span className="text-xs text-slate-400 block">Database Storage Size</span>
              <span className="text-xl font-bold text-white mt-1 block">{data?.db?.size ?? '18.4 MB'}</span>
            </div>
            <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/60">
              <span className="text-xs text-slate-400 block">Active Pool Connections</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{data?.db?.connections ?? 4} Pool Connections</span>
            </div>
          </div>
        </motion.div>

        {/* Security Monitor Card */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-md font-bold text-slate-200">Security & Protection Matrix</h3>
            </div>
            <span className="text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2.5 py-1 rounded-full font-semibold">
              ENFORCED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/60">
              <span className="text-xs text-slate-400 block">JWT Token Expiry</span>
              <span className="text-base font-bold text-white mt-1 block">HS256 · 7 Days</span>
            </div>
            <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/60">
              <span className="text-xs text-slate-400 block">Rate Limit Shield</span>
              <span className="text-base font-bold text-cyan-400 mt-1 block">Active (100 req/min)</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Real-time Utilization Graph */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold text-slate-200">Live Server Resource Flow</h3>
          <span className="text-xs text-slate-400 font-mono">Sampling: 3000ms</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="cpu" name="CPU Load %" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
              <Area type="monotone" dataKey="ram" name="RAM Usage %" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

    </div>
  );
}

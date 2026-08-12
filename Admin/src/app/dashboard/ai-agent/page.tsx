'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, RefreshCcw, Image, CheckCircle, Cpu } from 'lucide-react';

export default function AiAgentPage() {
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const triggerJob = async (jobType: string, label: string) => {
    setRunningJob(jobType);
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] Triggering ${label}...`, ...prev]);
    try {
      const res = await fetch('/api/admin/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType }),
      });
      const data = await res.json();
      if (data.ok) {
        setLog((prev) => [
          `[${new Date().toLocaleTimeString()}] ✅ ${label} Completed. (Processed: ${data.stats.processed}, Confidence: ${data.stats.confidence})`,
          ...prev,
        ]);
      } else {
        setLog((prev) => [`[${new Date().toLocaleTimeString()}] ❌ Failed: ${data.error}`, ...prev]);
      }
    } catch (err) {
      setLog((prev) => [`[${new Date().toLocaleTimeString()}] ❌ Execution Error`, ...prev]);
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-[#0b0e14] min-h-screen font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Bot className="w-7 h-7 text-amber-400" />
          <h1 className="text-3xl font-black text-white tracking-tight">AI Agent Control</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Run AI jobs to sync data, generate content, verify profiles, and tag image ownership.
        </p>
      </div>

      {/* Triggerable AI Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'sync', name: 'Sync External Data', icon: RefreshCcw, desc: 'Fetch latest matches & transfers' },
          { id: 'generate', name: 'Generate AI Articles', icon: Sparkles, desc: 'Auto-draft news & gossip feeds' },
          { id: 'verify', name: 'Verify Athlete Profiles', icon: CheckCircle, desc: 'Audit claim proofs & records' },
          { id: 'image-tag', name: 'Tag Image Ownership', icon: Image, desc: 'Scan & apply media credits' },
        ].map((job) => (
          <motion.div
            key={job.id}
            whileHover={{ y: -3 }}
            className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3"
          >
            <div className="flex items-center gap-2">
              <job.icon className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm">{job.name}</h3>
            </div>
            <p className="text-xs text-slate-400">{job.desc}</p>
            <button
              onClick={() => triggerJob(job.id, job.name)}
              disabled={runningJob !== null}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition disabled:opacity-50"
            >
              {runningJob === job.id ? 'Running AI Job...' : 'Execute Job'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Execution Console */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 font-mono">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>AI AGENT RUNTIME CONSOLE</span>
        </div>
        <div className="h-48 overflow-y-auto space-y-1 text-xs text-emerald-400 pt-2">
          {log.length === 0 ? (
            <p className="text-slate-600">Console ready. Click any job above to trigger AI tasks.</p>
          ) : (
            log.map((line, i) => <div key={i}>{line}</div>)
          )}
        </div>
      </div>

    </div>
  );
}

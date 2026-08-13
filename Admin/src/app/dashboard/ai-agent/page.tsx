"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, RefreshCcw, Image, CheckCircle, Cpu } from "lucide-react";

type JobRow = {
  id: string;
  jobType: string;
  status: string;
  itemsCreated?: number;
  itemsUpdated?: number;
  itemsProcessed?: number;
  startedAt?: string;
  completedAt?: string | null;
  logMessage?: string | null;
};

const JOBS = [
  { id: "sync_sports", name: "Sync External Data", icon: RefreshCcw, desc: "Fetch latest matches & standings", endpoint: "/api/admin/ai/sync", body: {} },
  { id: "generate_news", name: "Generate AI Articles", icon: Sparkles, desc: "Auto-draft news from matches", endpoint: "/api/admin/ai/generate", body: { type: "generate_news" } },
  { id: "generate_rumors", name: "Generate Rumors", icon: Sparkles, desc: "Draft transfer rumor blurbs", endpoint: "/api/admin/ai/generate", body: { type: "generate_rumors" } },
  { id: "verify_profiles", name: "Verify Athlete Profiles", icon: CheckCircle, desc: "Audit claim proofs & records", endpoint: "/api/admin/ai/generate", body: { type: "verify_profiles" } },
  { id: "tag_images", name: "Tag Image Ownership", icon: Image, desc: "Scan & apply media credits", endpoint: "/api/admin/ai/generate", body: { type: "tag_images" } },
] as const;

export default function AiAgentPage() {
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/admin/ai/jobs?limit=30", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) setJobs(data.data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const triggerJob = async (job: (typeof JOBS)[number]) => {
    setRunningJob(job.id);
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] Triggering ${job.name}...`, ...prev]);
    try {
      const res = await fetch(job.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job.body),
      });
      const data = await res.json();
      if (res.ok) {
        const created = data?.result?.itemsCreated ?? data?.itemsCreated ?? 0;
        const updated = data?.result?.itemsUpdated ?? data?.itemsUpdated ?? 0;
        setLog((prev) => [
          `[${new Date().toLocaleTimeString()}] ✅ ${job.name} done (created: ${created}, updated: ${updated})`,
          ...prev,
        ]);
        await loadJobs();
      } else {
        setLog((prev) => [
          `[${new Date().toLocaleTimeString()}] ❌ Failed: ${data.error || res.statusText}`,
          ...prev,
        ]);
      }
    } catch {
      setLog((prev) => [`[${new Date().toLocaleTimeString()}] ❌ Execution error`, ...prev]);
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-[#0b0e14] min-h-screen font-sans">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Bot className="w-7 h-7 text-amber-400" />
          <h1 className="text-3xl font-black text-white tracking-tight">AI Agent Control</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Run AI jobs to sync data, generate content, verify profiles, and tag image ownership.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {JOBS.map((job) => (
          <motion.div
            key={job.id}
            whileHover={{ y: -2 }}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-3"
          >
            <div className="flex items-center gap-2">
              <job.icon className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">{job.name}</h3>
            </div>
            <p className="text-xs text-slate-400">{job.desc}</p>
            <button
              disabled={runningJob !== null}
              onClick={() => triggerJob(job)}
              className="w-full py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold disabled:opacity-40 hover:bg-amber-500/25 transition"
            >
              {runningJob === job.id ? "Running…" : "Run job"}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-200">Live log</h2>
          </div>
          <div className="h-64 overflow-y-auto font-mono text-xs text-slate-400 space-y-1">
            {log.length === 0 ? <p className="text-slate-600">No jobs run this session.</p> : null}
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
          <h2 className="font-semibold text-slate-200 mb-3">Recent AI jobs</h2>
          <div className="h-64 overflow-y-auto text-xs space-y-2">
            {jobs.length === 0 ? <p className="text-slate-600">No jobs logged yet.</p> : null}
            {jobs.map((j) => (
              <div key={j.id} className="p-2 rounded-lg border border-slate-800/80 flex justify-between gap-2">
                <div>
                  <div className="text-slate-200 font-medium">{j.jobType}</div>
                  <div className="text-slate-500">{j.startedAt ? new Date(j.startedAt).toLocaleString() : "—"}</div>
                </div>
                <span
                  className={`self-start px-2 py-0.5 rounded-full border text-[10px] uppercase ${
                    j.status === "success"
                      ? "text-emerald-400 border-emerald-500/30"
                      : j.status === "failed"
                        ? "text-rose-400 border-rose-500/30"
                        : "text-amber-400 border-amber-500/30"
                  }`}
                >
                  {j.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

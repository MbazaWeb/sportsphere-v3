"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Plus, X, Server, Cpu, BookOpen, Zap, ChevronDown, ChevronUp,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

/* -- types ------------------------------------------------- */
type Provider = {
  id: string;
  name: string;
  displayName?: string;
  status?: string;
  modelCount?: number;
};

type Model = {
  id: string;
  name: string;
  provider?: string;
  costPer1kTokens?: number;
  maxTokens?: number;
  status?: string;
};

type KnowledgeSource = {
  id: string;
  type?: string;
  title?: string;
  department?: string;
  status?: string;
};

type Workflow = {
  id: string;
  name: string;
  triggerType?: string;
  status?: string;
};

/* -- collapsible section ----------------------------------- */
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/20 transition"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">{title}</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800/60"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const cls =
    status === 'active' || status === 'enabled'
      ? 'text-emerald-400 border-emerald-500/30'
      : status === 'failed' || status === 'error'
        ? 'text-rose-400 border-rose-500/30'
        : status === 'disabled' || status === 'inactive'
          ? 'text-slate-400 border-slate-600/30'
          : 'text-amber-400 border-amber-500/30';
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-semibold ${cls}`}>
      {status || 'unknown'}
    </span>
  );
}

/* -- page -------------------------------------------------- */
export default function AISettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeSource[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', displayName: '', apiKey: '', baseUrl: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/ai-workforce/settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers ?? []);
          setModels(data.models ?? []);
          setKnowledge(data.knowledge ?? []);
          setWorkflows(data.workflows ?? []);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddProvider = async () => {
    try {
      const res = await adminFetch('/api/admin/ai-workforce/settings/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider),
      });
      if (res.ok) {
        setProviders((prev) => [...prev, { ...newProvider, id: Date.now().toString(), status: 'active', modelCount: 0 }]);
        setNewProvider({ name: '', displayName: '', apiKey: '', baseUrl: '' });
        setShowProviderModal(false);
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Settings className="w-7 h-7 text-amber-400" />
          <h1 className="text-3xl font-black text-white tracking-tight">AI System Settings</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">Configure providers, models, knowledge base, and workflows</p>
      </div>

      {/* AI Providers */}
      <CollapsibleSection title="AI Providers" icon={Server}>
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowProviderModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-3 py-1.5 hover:bg-amber-500/25 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Provider
          </button>
        </div>
        <div className="space-y-2">
          {providers.length === 0 ? (
            <p className="text-slate-600 text-sm py-4 text-center">No providers configured</p>
          ) : (
            providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                <div className="flex items-center gap-3 min-w-0">
                  <Server className="w-4 h-4 text-amber-400/60 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium">{p.displayName || p.name}</p>
                    <p className="text-xs text-slate-500">{p.name} · {p.modelCount ?? 0} models</p>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      {/* Models */}
      <CollapsibleSection title="Models" icon={Cpu} defaultOpen={false}>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {models.length === 0 ? (
            <p className="text-slate-600 text-sm py-4 text-center">No models configured</p>
          ) : (
            models.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 font-medium">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.provider || '—'} · Max {m.maxTokens?.toLocaleString() ?? '—'} tokens</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 tabular-nums">${(m.costPer1kTokens ?? 0).toFixed(4)}/1k</span>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      {/* Knowledge Base */}
      <CollapsibleSection title="Knowledge Base" icon={BookOpen} defaultOpen={false}>
        <div className="flex justify-end mb-4">
          <button className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-3 py-1.5 hover:bg-amber-500/25 transition">
            <Plus className="w-3.5 h-3.5" /> Add Source
          </button>
        </div>
        <div className="space-y-2">
          {knowledge.length === 0 ? (
            <p className="text-slate-600 text-sm py-4 text-center">No knowledge sources</p>
          ) : (
            knowledge.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                <div className="flex items-center gap-3 min-w-0">
                  <BookOpen className="w-4 h-4 text-amber-400/60 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{k.title || '—'}</p>
                    <p className="text-xs text-slate-500">{k.type || '—'} · {k.department || '—'}</p>
                  </div>
                </div>
                <StatusBadge status={k.status} />
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      {/* Workflows */}
      <CollapsibleSection title="Workflows" icon={Zap} defaultOpen={false}>
        <div className="space-y-2">
          {workflows.length === 0 ? (
            <p className="text-slate-600 text-sm py-4 text-center">No workflows configured</p>
          ) : (
            workflows.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                <div className="flex items-center gap-3 min-w-0">
                  <Zap className="w-4 h-4 text-amber-400/60 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium">{w.name}</p>
                    <p className="text-xs text-slate-500">Trigger: {w.triggerType || '—'}</p>
                  </div>
                </div>
                <StatusBadge status={w.status} />
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      {/* Add Provider Modal */}
      <AnimatePresence>
        {showProviderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowProviderModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border border-slate-800 bg-[#0f141c] p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-white">Add AI Provider</h3>
                <button onClick={() => setShowProviderModal(false)} className="text-slate-500 hover:text-slate-300 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Provider Name</label>
                  <input
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    placeholder="e.g. openai"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Display Name</label>
                  <input
                    value={newProvider.displayName}
                    onChange={(e) => setNewProvider({ ...newProvider, displayName: e.target.value })}
                    placeholder="e.g. OpenAI"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">API Key</label>
                  <input
                    type="password"
                    value={newProvider.apiKey}
                    onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Base URL</label>
                  <input
                    value={newProvider.baseUrl}
                    onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/40 transition"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setShowProviderModal(false)}
                  className="rounded-xl border border-slate-700 text-slate-300 text-sm px-4 py-2 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProvider}
                  disabled={!newProvider.name || !newProvider.apiKey}
                  className="rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold px-4 py-2 hover:bg-amber-500/25 transition disabled:opacity-40"
                >
                  Add Provider
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

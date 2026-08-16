"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Clock, Bot, CheckCircle, XCircle, AlertTriangle, Zap,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

/* -- types ------------------------------------------------- */
type Approval = {
  id: string;
  taskType?: string;
  agentName?: string;
  riskLevel?: string;
  actionDescription?: string;
  requestedAt?: string;
  status?: string;
};

function RiskBadge({ risk }: { risk?: string }) {
  const cls =
    risk === 'critical' || risk === 'high'
      ? 'text-red-400 bg-red-500/10 border-red-500/20'
      : risk === 'medium'
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-semibold ${cls}`}>
      {risk || 'low'}
    </span>
  );
}

/* -- page -------------------------------------------------- */
export default function ApprovalQueuePage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadApprovals = async () => {
    try {
      const res = await adminFetch('/api/admin/ai-workforce/approvals', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleDecision = async (id: string, decision: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      await adminFetch(`/api/admin/ai-workforce/approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      setApprovals((prev) => prev.filter((a) => a.id !== id));
    } catch { /* ignore */ } finally {
      setProcessing(null);
    }
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
          <Shield className="w-7 h-7 text-amber-400" />
          <h1 className="text-3xl font-black text-white tracking-tight">Approval Queue</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">Review and approve actions requiring human oversight</p>
      </div>

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
          <CheckCircle className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => (
            <motion.div
              key={approval.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{approval.taskType || 'Action'}</h3>
                      <RiskBadge risk={approval.riskLevel} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> {approval.agentName || '—'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {approval.requestedAt ? new Date(approval.requestedAt).toLocaleString() : '—'}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-2">{approval.actionDescription || 'No description provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDecision(approval.id, 'approve')}
                    disabled={processing === approval.id}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-semibold px-4 py-2 hover:bg-emerald-500/25 transition disabled:opacity-40"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDecision(approval.id, 'reject')}
                    disabled={processing === approval.id}
                    className="flex items-center gap-1.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm font-semibold px-4 py-2 hover:bg-red-500/25 transition disabled:opacity-40"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

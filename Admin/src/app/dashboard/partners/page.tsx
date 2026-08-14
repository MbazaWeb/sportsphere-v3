'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Diamond,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Eye,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  CalendarDays,
  DollarSign,
  Clock,
  X,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

// ─── Types ────────────────────────────────────────────────

interface Partner {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  status: 'active' | 'pending' | 'expired' | 'suspended';
  contractValue: number;
  contractStart: string;
  contractEnd: string;
  website?: string;
  industry?: string;
  notes?: string;
  impressionCount?: number;
  clickCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface PartnerResponse {
  ok: boolean;
  partners: Partner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────

const TIERS: { id: Partner['tier']; label: string; color: string; bg: string; border: string }[] = [
  { id: 'platinum', label: 'Platinum', color: 'text-slate-100', bg: 'bg-slate-100/10', border: 'border-slate-100/30' },
  { id: 'gold', label: 'Gold', color: 'text-amber-300', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  { id: 'silver', label: 'Silver', color: 'text-slate-300', bg: 'bg-slate-400/10', border: 'border-slate-400/30' },
  { id: 'bronze', label: 'Bronze', color: 'text-orange-300', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
];

const STATUSES: { id: Partner['status']; label: string; icon: React.ReactNode }[] = [
  { id: 'active', label: 'Active', icon: <CheckCircle2 className="w-3 h-3" /> },
  { id: 'pending', label: 'Pending', icon: <Clock className="w-3 h-3" /> },
  { id: 'expired', label: 'Expired', icon: <AlertTriangle className="w-3 h-3" /> },
  { id: 'suspended', label: 'Suspended', icon: <XCircle className="w-3 h-3" /> },
];

const STATUS_STYLES: Record<Partner['status'], string> = {
  active: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  pending: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  expired: 'bg-slate-500/15 border-slate-500/30 text-slate-400',
  suspended: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
};

const TIER_STYLES: Record<Partner['tier'], string> = {
  platinum: 'bg-slate-100/10 border-slate-100/30 text-slate-100',
  gold: 'bg-amber-400/10 border-amber-400/30 text-amber-300',
  silver: 'bg-slate-400/10 border-slate-400/30 text-slate-300',
  bronze: 'bg-orange-400/10 border-orange-400/30 text-orange-300',
};

const TIER_ICONS: Record<Partner['tier'], string> = {
  platinum: '💎',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

const LIMIT = 20;

// ─── Component ────────────────────────────────────────────

export default function PartnersPage() {
  // Data
  const [partners, setPartners] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | Partner['status']>('');
  const [tierFilter, setTierFilter] = useState<'' | Partner['tier']>('');
  const [page, setPage] = useState(1);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewPartner, setViewPartner] = useState<Partner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    tier: 'silver' as Partner['tier'],
    status: 'pending' as Partner['status'],
    contractValue: '',
    contractStart: '',
    contractEnd: '',
    website: '',
    industry: '',
    notes: '',
  });

  // ─── Fetch ──────────────────────────────────────────

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (tierFilter) params.set('tier', tierFilter);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));

      const res = await adminFetch(`/api/admin/partners?${params.toString()}`, {
        cache: 'no-store',
      });
      const data: PartnerResponse = await res.json();

      if (!res.ok) {
        setError(data?.ok === false ? 'Failed to load partners' : 'Unknown error');
        setPartners([]);
        setTotal(0);
        setTotalPages(0);
      } else {
        setPartners(data.partners || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      console.error('Partners load error:', err);
      setError('Network error.');
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, tierFilter, page]);

  useEffect(() => {
    const t = setTimeout(fetchPartners, 300);
    return () => clearTimeout(t);
  }, [fetchPartners]);

  // ─── Filter helpers (reset page when filters change) ──
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val: '' | Partner['status']) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleTierChange = (val: '' | Partner['tier']) => {
    setTierFilter(val);
    setPage(1);
  };

  // ─── Actions ────────────────────────────────────────

  const openCreate = () => {
    setForm({
      companyName: '',
      contactName: '',
      contactEmail: '',
      tier: 'silver',
      status: 'pending',
      contractValue: '',
      contractStart: '',
      contractEnd: '',
      website: '',
      industry: '',
      notes: '',
    });
    setErrMsg(null);
    setMsg(null);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.contactEmail.trim()) return;
    setSubmitting(true);
    setMsg(null);
    setErrMsg(null);
    try {
      const payload: Record<string, unknown> = {
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        tier: form.tier,
        status: form.status,
        contractValue: parseFloat(form.contractValue) || 0,
        contractStart: form.contractStart || null,
        contractEnd: form.contractEnd || null,
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        notes: form.notes.trim() || null,
      };

      const res = await adminFetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrMsg(data?.error || 'Failed to create partner.');
      } else {
        setMsg(`Partner "${form.companyName}" created successfully.`);
        setIsModalOpen(false);
        fetchPartners();
      }
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Computed ───────────────────────────────────────

  const activeCount = partners.filter((p) => p.status === 'active').length;
  const pendingCount = partners.filter((p) => p.status === 'pending').length;
  const totalValue = partners.reduce((sum, p) => sum + (p.contractValue || 0), 0);

  // ─── Helpers ────────────────────────────────────────

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    updateField((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <Diamond className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Commercial Partners
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Manage sponsorship deals, brand partnerships, and commercial agreements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPartners}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Partner</span>
          </button>
        </div>
      </div>

      {/* ─── Stats Strip ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Building2 className="w-3.5 h-3.5" /> Total
          </div>
          <div className="text-2xl font-black text-white tabular-nums">{total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-400/70 uppercase tracking-wider font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </div>
          <div className="text-2xl font-black text-emerald-300 tabular-nums">{activeCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400/70 uppercase tracking-wider font-semibold">
            <Clock className="w-3.5 h-3.5" /> Pending
          </div>
          <div className="text-2xl font-black text-amber-300 tabular-nums">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-1">
          <div className="flex items-center gap-2 text-xs text-sky-400/70 uppercase tracking-wider font-semibold">
            <DollarSign className="w-3.5 h-3.5" /> Portfolio Value
          </div>
          <div className="text-2xl font-black text-sky-300 tabular-nums">
            ${totalValue >= 1_000_000 ? `${(totalValue / 1_000_000).toFixed(1)}M` : totalValue >= 1_000 ? `${(totalValue / 1_000).toFixed(0)}K` : totalValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ─── Filter Bar ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="sm:col-span-2 lg:col-span-1 relative">
          <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Search</label>
          <Search className="absolute left-3 top-[calc(50%+8px)] -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Company or contact name…"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 pl-9 text-xs text-slate-200 focus:outline-none focus:border-amber-400 placeholder-slate-600"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as '' | Partner['status'])}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Tier</label>
          <select
            value={tierFilter}
            onChange={(e) => handleTierChange(e.target.value as '' | Partner['tier'])}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="">All Tiers</option>
            {TIERS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              handleSearchChange('');
              handleStatusChange('');
              handleTierChange('');
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 hover:text-slate-200 transition"
          >
            <X className="w-3 h-3" /> Clear Filters
          </button>
        </div>
      </div>

      {/* ─── Feedback ────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {msg && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {msg}
          <button onClick={() => setMsg(null)} className="ml-auto text-emerald-400/60 hover:text-emerald-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── Table ──────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#141b26] border-b border-slate-800">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                  Partner
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                  Tier
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                  Contract Value
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                  Period
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                  Performance
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase text-xs tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-500 text-sm">Loading partners…</p>
                    </div>
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-10 h-10 text-slate-700" />
                      <div>
                        <p className="text-slate-400 text-sm font-medium">No partners found</p>
                        <p className="text-slate-600 text-xs mt-1">Try adjusting your search or filters, or add a new partner.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                partners.map((partner, idx) => (
                  <motion.tr
                    key={partner.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Partner Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                          {partner.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-100 truncate">{partner.companyName}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {partner.contactEmail}
                            </span>
                            {partner.industry && (
                              <span className="text-slate-600">· {partner.industry}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${TIER_STYLES[partner.tier]}`}
                      >
                        <span>{TIER_ICONS[partner.tier]}</span>
                        {partner.tier}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[partner.status]}`}
                      >
                        {STATUSES.find((s) => s.id === partner.status)?.icon}
                        {partner.status}
                      </span>
                    </td>

                    {/* Contract Value */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200 tabular-nums">
                        ${partner.contractValue?.toLocaleString() ?? '—'}
                      </div>
                    </td>

                    {/* Period */}
                    <td className="px-4 py-3.5">
                      <div className="text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {partner.contractStart
                            ? new Date(partner.contractStart).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                          {' → '}
                          {partner.contractEnd
                            ? new Date(partner.contractEnd).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </div>
                      </div>
                    </td>

                    {/* Performance */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Eye className="w-3 h-3" />
                          <span className="tabular-nums">{(partner.impressionCount ?? 0).toLocaleString()}</span>
                          <span className="text-slate-600">impressions</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <TrendingUp className="w-3 h-3" />
                          <span className="tabular-nums">{(partner.clickCount ?? 0).toLocaleString()}</span>
                          <span className="text-slate-600">clicks</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewPartner(partner)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 transition"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {partner.website && (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition"
                            title="Open website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Pagination ──────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Page {page} of {totalPages} · {total} partner{total !== 1 ? 's' : ''} total
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500 transition disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      page === pageNum
                        ? 'bg-amber-400/15 border border-amber-400/40 text-amber-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500 transition disabled:opacity-30 disabled:pointer-events-none"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Create Modal ────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f141c] border border-slate-800 rounded-2xl w-full max-w-lg space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-0">
                <div>
                  <h2 className="text-lg font-extrabold text-white">Add Commercial Partner</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fill in the partnership details below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errMsg && (
                <div className="mx-6 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {errMsg}
                </div>
              )}

              <form onSubmit={handleCreate} className="px-6 pb-6 space-y-4">
                {/* Company Name */}
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                    Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nike, Red Bull, Emirates"
                    value={form.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-slate-600"
                  />
                </div>

                {/* Contact row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      value={form.contactName}
                      onChange={(e) => updateField('contactName', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                      Contact Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="partner@company.com"
                      value={form.contactEmail}
                      onChange={(e) => updateField('contactEmail', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Tier & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                      Tier
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIERS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => updateField('tier', t.id)}
                          className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border text-xs font-semibold transition ${
                            form.tier === t.id
                              ? `${t.bg} ${t.border} ${t.color}`
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-base">{TIER_ICONS[t.id]}</span>
                          <span className="text-[10px] uppercase tracking-wider">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                      Initial Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => updateField('status', e.target.value as Partner['status'])}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contract details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                      Contract Value ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="500000"
                      value={form.contractValue}
                      onChange={(e) => updateField('contractValue', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-slate-600 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={form.contractStart}
                      onChange={(e) => updateField('contractStart', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={form.contractEnd}
                      onChange={(e) => updateField('contractEnd', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Website & Industry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                      Website
                    </label>
                    <input
                      type="url"
                      placeholder="https://company.com"
                      value={form.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                      Industry
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sportswear, Beverage, Finance"
                      value={form.industry}
                      onChange={(e) => updateField('industry', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Internal notes about this partnership…"
                    value={form.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-slate-600 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !form.companyName.trim() || !form.contactEmail.trim()}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/10 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        Creating…
                      </span>
                    ) : (
                      'Create Partner'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── View Details Modal ──────────────────────────── */}
      <AnimatePresence>
        {viewPartner && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f141c] border border-slate-800 rounded-2xl w-full max-w-md space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-slate-200">
                    {viewPartner.companyName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">{viewPartner.companyName}</h2>
                    <p className="text-xs text-slate-500">{viewPartner.industry || 'No industry specified'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewPartner(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 pb-6 space-y-4">
                {/* Badges row */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${TIER_STYLES[viewPartner.tier]}`}
                  >
                    {TIER_ICONS[viewPartner.tier]} {viewPartner.tier}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[viewPartner.status]}`}
                  >
                    {STATUSES.find((s) => s.id === viewPartner.status)?.icon} {viewPartner.status}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  <DetailCard
                    icon={<Users className="w-4 h-4" />}
                    label="Contact"
                    value={viewPartner.contactName || '—'}
                  />
                  <DetailCard
                    icon={<Mail className="w-4 h-4" />}
                    label="Email"
                    value={viewPartner.contactEmail}
                  />
                  <DetailCard
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Contract Value"
                    value={viewPartner.contractValue ? `$${viewPartner.contractValue.toLocaleString()}` : '—'}
                    accent
                  />
                  <DetailCard
                    icon={<CalendarDays className="w-4 h-4" />}
                    label="Contract Period"
                    value={
                      viewPartner.contractStart
                        ? `${new Date(viewPartner.contractStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${viewPartner.contractEnd ? new Date(viewPartner.contractEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}`
                        : '—'
                    }
                  />
                </div>

                {/* Performance stats */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Performance</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-bold text-slate-100 tabular-nums">{(viewPartner.impressionCount ?? 0).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Impressions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-bold text-slate-100 tabular-nums">{(viewPartner.clickCount ?? 0).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Clicks</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {viewPartner.notes && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider mb-1.5">Notes</div>
                    <p className="text-sm text-slate-300 leading-relaxed">{viewPartner.notes}</p>
                  </div>
                )}

                {/* Website link */}
                {viewPartner.website && (
                  <a
                    href={viewPartner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition"
                  >
                    <ExternalLink className="w-4 h-4" /> {viewPartner.website}
                  </a>
                )}

                {/* Timestamps */}
                <div className="text-[11px] text-slate-600 flex gap-4">
                  <span>Created: {new Date(viewPartner.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(viewPartner.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Detail Card Sub-component ──────────────────────────

function DetailCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
        {icon}
        {label}
      </div>
      <div className={`text-sm font-semibold truncate ${accent ? 'text-amber-300' : 'text-slate-200'}`}>
        {value}
      </div>
    </div>
  );
}

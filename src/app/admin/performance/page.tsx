"use client";

// ─── Admin: Performance KPI Configuration ───────────────────────
//
// Page at /admin/performance
//
// Lists all KPI configurations (from KPIConfiguration table) with their
// point values and per-position weight overrides (from KPIWeight table).
//
// Admin can:
//   - Filter by category (attacking / creativity / defensive / gk / discipline / fitness / record / team-performance)
//   - Toggle a KPI active/inactive
//   - Edit point values (positivePointsPerUnit, negativePointsPerUnit, maxContribution)
//   - Add/edit per-scope weight multipliers (position, role, competition, ageGroup)
//   - Create a new KPI
//
// All edits go through /api/admin/performance/kpi (POST) and /api/admin/performance/kpi/[id] (PUT)
// and /api/admin/performance/kpi/[id]/weights (POST).

import React, { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
  Plus, Save, X, Search, Filter, RefreshCw, Loader2,
  Activity, TrendingUp, Shield, Hand, Target, Zap, Award,
  AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Edit3, Power,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──
interface KpiWeight {
  id: string;
  kpiConfigId: string;
  scope: string;          // 'position' | 'role' | 'competition' | 'ageGroup'
  scopeValue: string;     // 'GK' | 'player' | 'pro' | 'U17' etc
  weightMultiplier: number;
  difficultyMultiplier: number;
  isActive: boolean;
}

interface KpiConfig {
  id: string;
  kpiKey: string;
  label: string;
  category: string;
  appliesToRoles: string[];
  appliesToPositions: string[];
  positivePointsPerUnit: number;
  negativePointsPerUnit: number;
  maxContributionPerMatch: number;
  maxContributionPerSeason: number;
  minValue: number;
  maxValue: number;
  isActive: boolean;
  description: string | null;
  weights: KpiWeight[];
}

interface CategoryMeta {
  id: string;
  label: string;
  icon: typeof Activity;
  color: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: "attacking",          label: "Attacking",          icon: Target,    color: "text-rose-400" },
  { id: "creativity",         label: "Creativity",         icon: Zap,       color: "text-purple-400" },
  { id: "defensive",          label: "Defensive",          icon: Shield,    color: "text-blue-400" },
  { id: "gk",                 label: "Goalkeeper",         icon: Hand,      color: "text-emerald-400" },
  { id: "discipline",         label: "Discipline",         icon: AlertCircle, color: "text-amber-400" },
  { id: "fitness",            label: "Fitness / Form",     icon: Activity,  color: "text-cyan-400" },
  { id: "record",             label: "Coach Record",       icon: TrendingUp, color: "text-orange-400" },
  { id: "team-performance",   label: "Team Performance",   icon: Award,     color: "text-pink-400" },
];

const SCOPE_OPTIONS = [
  { value: "position",    label: "Position",    values: ["GK", "DEF", "MID", "FWD"] },
  { value: "role",        label: "Role",        values: ["player", "coach", "team"] },
  { value: "competition", label: "Competition", values: ["pro", "semi-pro", "amateur", "youth"] },
  { value: "ageGroup",    label: "Age Group",   values: ["U13", "U15", "U17", "U20", "Senior"] },
];

export default function AdminPerformancePage() {
  const [kpis, setKpis] = useState<KpiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/admin/performance/kpi");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setKpis(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load KPI configs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = kpis.filter((k) => {
    if (activeFilter !== "all" && k.category !== activeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return k.kpiKey.toLowerCase().includes(q) || k.label.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by category for display
  const grouped: Record<string, KpiConfig[]> = {};
  for (const k of filtered) {
    if (!grouped[k.category]) grouped[k.category] = [];
    grouped[k.category].push(k);
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Performance KPIs</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure KPI point values and per-position weight multipliers that drive the
            performance scoring engine. Changes take effect on the next recalc.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300 transition-colors"
        >
          <Plus className="h-4 w-4" /> New KPI
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search KPIs..."
            className="w-64 rounded-lg border border-slate-700 bg-[#0f141c] py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
            activeFilter === "all"
              ? "bg-amber-400 text-black"
              : "bg-slate-800 text-slate-400 hover:text-white"
          )}
        >
          All ({kpis.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = kpis.filter((k) => k.category === cat.id).length;
          if (count === 0) return null;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                activeFilter === cat.id
                  ? "bg-amber-400 text-black"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label} ({count})
            </button>
          );
        })}
        <button
          onClick={load}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-8 text-center">
          <Activity className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">No KPIs configured</h3>
          <p className="mt-1 text-xs text-slate-500">
            Run <code className="rounded bg-slate-800 px-1 py-0.5 text-amber-400">npx tsx prisma/seed-kpi-config.ts</code> to seed defaults,
            or click "New KPI" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => {
            const catMeta = CATEGORIES.find((c) => c.id === cat);
            const Icon = catMeta?.icon ?? Activity;
            return (
              <div key={cat}>
                <h2 className={cn("mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider", catMeta?.color ?? "text-slate-400")}>
                  <Icon className="h-4 w-4" />
                  {catMeta?.label ?? cat}
                  <span className="text-slate-600">({items.length})</span>
                </h2>
                <div className="space-y-2">
                  {items.map((kpi) => (
                    <KpiRow
                      key={kpi.id}
                      kpi={kpi}
                      expanded={expandedId === kpi.id}
                      onToggleExpand={() => setExpandedId(expandedId === kpi.id ? null : kpi.id)}
                      onUpdated={(updated) => {
                        setKpis((prev) => prev.map((k) => k.id === updated.id ? updated : k));
                        showToast(`✓ ${updated.label} updated`, true);
                      }}
                      onError={(msg) => showToast(msg, false)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <CreateKpiModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newKpi) => {
            setKpis((prev) => [...prev, newKpi]);
            setShowCreateModal(false);
            showToast(`✓ ${newKpi.label} created`, true);
          }}
          onError={(msg) => showToast(msg, false)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={cn(
          "fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm font-semibold shadow-xl",
          toast.ok
            ? "border-emerald-600 bg-emerald-950/90 text-emerald-300"
            : "border-rose-600 bg-rose-950/90 text-rose-300"
        )}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── KPI Row (collapsible) ──────────────────────────────────────

function KpiRow({
  kpi, expanded, onToggleExpand, onUpdated, onError,
}: {
  kpi: KpiConfig;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdated: (k: KpiConfig) => void;
  onError: (msg: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState({
    positivePointsPerUnit: kpi.positivePointsPerUnit,
    negativePointsPerUnit: kpi.negativePointsPerUnit,
    maxContributionPerMatch: kpi.maxContributionPerMatch,
    maxContributionPerSeason: kpi.maxContributionPerSeason,
    minValue: kpi.minValue,
    maxValue: kpi.maxValue,
  });
  const [newWeight, setNewWeight] = useState({ scope: "position", scopeValue: "GK", weightMultiplier: 1.0, difficultyMultiplier: 1.0 });

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/performance/kpi/${kpi.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const updated = await res.json();
      onUpdated(updated);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/performance/kpi/${kpi.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !kpi.isActive }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      onUpdated(updated);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setSaving(false);
    }
  };

  const addWeight = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/performance/kpi/${kpi.id}/weights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWeight),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const added = await res.json();
      onUpdated({ ...kpi, weights: [...kpi.weights.filter((w) => !(w.scope === added.scope && w.scopeValue === added.scopeValue)), added] });
      setNewWeight({ scope: "position", scopeValue: "GK", weightMultiplier: 1.0, difficultyMultiplier: 1.0 });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Add weight failed");
    } finally {
      setSaving(false);
    }
  };

  const removeWeight = async (weightId: string) => {
    setSaving(true);
    try {
      // Toggle isActive=false (soft delete)
      const res = await apiFetch(`/api/admin/performance/kpi/${kpi.id}/weights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights: [{ id: weightId, isActive: false }] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onUpdated({ ...kpi, weights: kpi.weights.filter((w) => w.id !== weightId) });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Remove weight failed");
    } finally {
      setSaving(false);
    }
  };

  const isNegative = kpi.negativePointsPerUnit !== 0 && kpi.positivePointsPerUnit === 0;
  const pointsLabel = isNegative
    ? `${kpi.negativePointsPerUnit}/unit (penalty)`
    : `+${kpi.positivePointsPerUnit}/unit`;

  return (
    <div className={cn(
      "rounded-xl border bg-[#0f141c] transition-colors",
      kpi.isActive ? "border-slate-800" : "border-slate-800 opacity-60"
    )}>
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggleExpand} className="text-slate-400 hover:text-white">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs font-mono text-amber-400">{kpi.kpiKey}</code>
            <span className="text-sm font-bold text-white">{kpi.label}</span>
            {!kpi.isActive && (
              <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400 uppercase">
                Inactive
              </span>
            )}
            {kpi.weights.length > 0 && (
              <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase">
                {kpi.weights.length} weight overrides
              </span>
            )}
          </div>
          {kpi.description && (
            <p className="mt-0.5 text-xs text-slate-500 truncate">{kpi.description}</p>
          )}
        </div>
        <div className="text-right">
          <div className={cn("text-sm font-bold tabular-nums", isNegative ? "text-rose-400" : "text-emerald-400")}>
            {pointsLabel}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
            Cap: {kpi.maxContributionPerMatch}/match · {kpi.maxContributionPerSeason}/season
          </div>
        </div>
        <button
          onClick={toggleActive}
          disabled={saving}
          title={kpi.isActive ? "Deactivate" : "Activate"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
            kpi.isActive
              ? "border-emerald-700 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50"
              : "border-slate-700 bg-slate-800 text-slate-500 hover:text-slate-300"
          )}
        >
          <Power className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-4">
          {/* Point values */}
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Point Values</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <NumberInput
                label="Positive / unit"
                value={editValues.positivePointsPerUnit}
                onChange={(v) => setEditValues({ ...editValues, positivePointsPerUnit: v })}
                step={0.5}
              />
              <NumberInput
                label="Negative / unit"
                value={editValues.negativePointsPerUnit}
                onChange={(v) => setEditValues({ ...editValues, negativePointsPerUnit: v })}
                step={0.5}
              />
              <NumberInput
                label="Max / match"
                value={editValues.maxContributionPerMatch}
                onChange={(v) => setEditValues({ ...editValues, maxContributionPerMatch: v })}
                step={5}
              />
              <NumberInput
                label="Max / season"
                value={editValues.maxContributionPerSeason}
                onChange={(v) => setEditValues({ ...editValues, maxContributionPerSeason: v })}
                step={50}
              />
              <NumberInput
                label="Min value"
                value={editValues.minValue}
                onChange={(v) => setEditValues({ ...editValues, minValue: v })}
                step={1}
              />
              <NumberInput
                label="Max value"
                value={editValues.maxValue}
                onChange={(v) => setEditValues({ ...editValues, maxValue: v })}
                step={5}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Applies to */}
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Applies To · Roles: <span className="text-slate-300">{kpi.appliesToRoles.length ? kpi.appliesToRoles.join(", ") : "any"}</span>
              {" · "}Positions: <span className="text-slate-300">{kpi.appliesToPositions.length ? kpi.appliesToPositions.join(", ") : "any"}</span>
            </h4>
          </div>

          {/* Weight overrides */}
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Weight Multipliers (per scope)
            </h4>
            {kpi.weights.length === 0 ? (
              <p className="text-xs text-slate-500 mb-2">No weight overrides — uses default weight from the position weight table.</p>
            ) : (
              <div className="mb-3 space-y-1.5">
                {kpi.weights.map((w) => (
                  <div key={w.id} className="flex items-center gap-3 rounded-lg bg-slate-800/40 p-2 text-xs">
                    <span className="rounded bg-slate-700 px-2 py-0.5 font-mono text-slate-300">{w.scope}</span>
                    <span className="text-slate-200">=</span>
                    <span className="rounded bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 font-bold text-amber-400">{w.scopeValue}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300">weight ×<span className="font-bold text-emerald-400">{w.weightMultiplier.toFixed(2)}</span></span>
                    <span className="text-slate-300">difficulty ×<span className="font-bold text-blue-400">{w.difficultyMultiplier.toFixed(2)}</span></span>
                    <button
                      onClick={() => removeWeight(w.id)}
                      className="ml-auto flex h-6 w-6 items-center justify-center rounded text-rose-400 hover:bg-rose-950/40"
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new weight */}
            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-700 bg-slate-800/30 p-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Scope</label>
                <select
                  value={newWeight.scope}
                  onChange={(e) => {
                    const scope = e.target.value;
                    const opt = SCOPE_OPTIONS.find((o) => o.value === scope);
                    setNewWeight({ ...newWeight, scope, scopeValue: opt?.values[0] ?? "" });
                  }}
                  className="rounded-md border border-slate-700 bg-[#0f141c] px-2 py-1.5 text-xs text-slate-100"
                >
                  {SCOPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Scope Value</label>
                <select
                  value={newWeight.scopeValue}
                  onChange={(e) => setNewWeight({ ...newWeight, scopeValue: e.target.value })}
                  className="rounded-md border border-slate-700 bg-[#0f141c] px-2 py-1.5 text-xs text-slate-100"
                >
                  {SCOPE_OPTIONS.find((o) => o.value === newWeight.scope)?.values.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <NumberInput
                label="Weight ×"
                value={newWeight.weightMultiplier}
                onChange={(v) => setNewWeight({ ...newWeight, weightMultiplier: v })}
                step={0.1}
              />
              <NumberInput
                label="Difficulty ×"
                value={newWeight.difficultyMultiplier}
                onChange={(v) => setNewWeight({ ...newWeight, difficultyMultiplier: v })}
                step={0.1}
              />
              <button
                onClick={addWeight}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add Weight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Number Input helper ────────────────────────────────────────

function NumberInput({
  label, value, onChange, step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-md border border-slate-700 bg-[#0f141c] px-2 py-1.5 text-sm text-slate-100 tabular-nums focus:border-amber-400 focus:outline-none"
      />
    </div>
  );
}

// ─── Create KPI Modal ───────────────────────────────────────────

function CreateKpiModal({
  onClose, onCreated, onError,
}: {
  onClose: () => void;
  onCreated: (k: KpiConfig) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    kpiKey: "",
    label: "",
    category: "attacking",
    description: "",
    positivePointsPerUnit: 0,
    negativePointsPerUnit: 0,
    maxContributionPerMatch: 0,
    maxContributionPerSeason: 0,
    minValue: 0,
    maxValue: 100,
    appliesToRoles: [] as string[],
    appliesToPositions: [] as string[],
  });
  const [creating, setCreating] = useState(false);

  const toggleArray = (arr: string[], v: string): string[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const submit = async () => {
    if (!form.kpiKey || !form.label) {
      onError("kpiKey and label are required");
      return;
    }
    setCreating(true);
    try {
      const res = await apiFetch("/api/admin/performance/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const created = await res.json();
      onCreated({ ...created, weights: [] });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#0f141c] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Create New KPI</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">KPI Key (camelCase)</label>
              <input
                type="text"
                value={form.kpiKey}
                onChange={(e) => setForm({ ...form, kpiKey: e.target.value })}
                placeholder="e.g. shotsBlocked"
                className="w-full rounded-md border border-slate-700 bg-[#0b0e14] px-3 py-2 text-sm text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Shots Blocked"
                className="w-full rounded-md border border-slate-700 bg-[#0b0e14] px-3 py-2 text-sm text-slate-100 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-md border border-slate-700 bg-[#0b0e14] px-3 py-2 text-sm text-slate-100"
            >
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What this KPI measures..."
              rows={2}
              className="w-full rounded-md border border-slate-700 bg-[#0b0e14] px-3 py-2 text-sm text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumberInput label="Positive / unit" value={form.positivePointsPerUnit} onChange={(v) => setForm({ ...form, positivePointsPerUnit: v })} step={0.5} />
            <NumberInput label="Negative / unit" value={form.negativePointsPerUnit} onChange={(v) => setForm({ ...form, negativePointsPerUnit: v })} step={0.5} />
            <NumberInput label="Max / match" value={form.maxContributionPerMatch} onChange={(v) => setForm({ ...form, maxContributionPerMatch: v })} step={5} />
            <NumberInput label="Max / season" value={form.maxContributionPerSeason} onChange={(v) => setForm({ ...form, maxContributionPerSeason: v })} step={50} />
            <NumberInput label="Min value" value={form.minValue} onChange={(v) => setForm({ ...form, minValue: v })} step={1} />
            <NumberInput label="Max value" value={form.maxValue} onChange={(v) => setForm({ ...form, maxValue: v })} step={5} />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Applies to Roles</label>
            <div className="flex gap-2">
              {["player", "coach", "team"].map((r) => (
                <button
                  key={r}
                  onClick={() => setForm({ ...form, appliesToRoles: toggleArray(form.appliesToRoles, r) })}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                    form.appliesToRoles.includes(r)
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                      : "border-slate-700 bg-slate-800 text-slate-400"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Applies to Positions</label>
            <div className="flex flex-wrap gap-2">
              {["GK", "DEF", "MID", "FWD"].map((p) => (
                <button
                  key={p}
                  onClick={() => setForm({ ...form, appliesToPositions: toggleArray(form.appliesToPositions, p) })}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                    form.appliesToPositions.includes(p)
                      ? "border-blue-500 bg-blue-500/15 text-blue-300"
                      : "border-slate-700 bg-slate-800 text-slate-400"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create KPI
          </button>
        </div>
      </div>
    </div>
  );
}

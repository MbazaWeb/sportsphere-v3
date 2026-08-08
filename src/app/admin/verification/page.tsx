"use client";

// ─── Admin: Performance Event Verification Queue ────────────────
//
// Page at /admin/verification
//
// Lists PerformanceEvents awaiting verification (status=pending by default).
// Each row shows: user, event type, value, points calculated, match info,
// source (manual/official/api-provider), KPI category, and actions:
//
//   ✓ Approve  — credits points to user's ledger, triggers recalc
//   ✗ Reject   — marks rejected (no points), prompts for reason
//
// Filters:
//   - Status: Pending / Verified / Rejected / All
//   - Role: All / Players / Coaches / Teams
//
// Stats header shows the queue health (pending/verified/rejected counts).
//
// All actions go through /api/admin/verification/events/[id]/review.

import React, { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Loader2,
  RefreshCw, Filter, ChevronDown, ChevronRight, User, ExternalLink,
  Calendar, MapPin, Trophy, Activity, FileText, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──
interface VerificationEvent {
  id: string;
  userId: string;
  kpiConfigId: string | null;
  eventType: string;
  value: number;
  matchId: string | null;
  matchExternalRef: string | null;
  competition: string | null;
  competitionTier: string | null;
  season: string | null;
  opponentName: string | null;
  opponentStrength: number | null;
  teamStrength: number | null;
  matchDate: string;
  source: string;
  sourceUserId: string | null;
  verificationStatus: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  pointsCalculated: number;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    handle: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    playerProfile: { position: string | null; playerType: string | null } | null;
    coachProfile: { coachingRole: string | null } | null;
    teamProfile: { nickname: string | null; league: string | null } | null;
  };
  kpiConfig: { kpiKey: string; label: string; category: string } | null;
  verification: {
    id: string;
    status: string;
    verifierRole: string;
    notes: string | null;
    reviewedAt: string | null;
  } | null;
  pointTransactions: Array<{
    id: string;
    amount: number;
    balanceAfter: number;
    createdAt: string;
  }>;
}

interface Summary {
  pending: number;
  verified: number;
  rejected: number;
}

type StatusFilter = "pending" | "verified" | "rejected" | "all";
type RoleFilter = "all" | "player" | "coach" | "team";

const STATUS_TABS: Array<{ id: StatusFilter; label: string; color: string }> = [
  { id: "pending",  label: "Pending",   color: "text-amber-400" },
  { id: "verified", label: "Verified",  color: "text-emerald-400" },
  { id: "rejected", label: "Rejected",  color: "text-rose-400" },
  { id: "all",      label: "All",       color: "text-slate-300" },
];

export default function AdminVerificationPage() {
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, verified: 0, rejected: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        limit: "50",
      });
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await apiFetch(`/api/admin/verification/events?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
      setSummary(data.summary ?? { pending: 0, verified: 0, rejected: 0 });
      setTotalCount(data.totalCount ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load verification queue");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (eventId: string) => {
    setProcessingId(eventId);
    try {
      const res = await apiFetch(`/api/admin/verification/events/${eventId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      showToast(`✓ Approved — ${data.pointsCredited} points credited to user`, true);
      // Reload list
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Approve failed", false);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (eventId: string) => {
    if (!rejectNotes.trim()) {
      showToast("Please provide a rejection reason", false);
      return;
    }
    setProcessingId(eventId);
    try {
      const res = await apiFetch(`/api/admin/verification/events/${eventId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", notes: rejectNotes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      showToast(`✓ Rejected`, true);
      setRejectingId(null);
      setRejectNotes("");
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Reject failed", false);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter by search (client-side)
  const filtered = events.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.user.name.toLowerCase().includes(q) ||
      e.user.handle.toLowerCase().includes(q) ||
      e.eventType.toLowerCase().includes(q) ||
      (e.competition ?? "").toLowerCase().includes(q) ||
      (e.opponentName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Event Verification</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review performance events submitted by users, scouts, and officials. Approved events
          credit points to the user's audited ledger and trigger a score recalculation.
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Pending"
          value={summary.pending}
          icon={Clock}
          color="text-amber-400"
          bg="bg-amber-400/10 border-amber-400/30"
        />
        <SummaryCard
          label="Verified"
          value={summary.verified}
          icon={CheckCircle2}
          color="text-emerald-400"
          bg="bg-emerald-400/10 border-emerald-400/30"
        />
        <SummaryCard
          label="Rejected"
          value={summary.rejected}
          icon={XCircle}
          color="text-rose-400"
          bg="bg-rose-400/10 border-rose-400/30"
        />
        <SummaryCard
          label="Total"
          value={summary.pending + summary.verified + summary.rejected}
          icon={Activity}
          color="text-slate-300"
          bg="bg-slate-700/30 border-slate-700"
        />
      </div>

      {/* ── Filters ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-slate-700 bg-[#0f141c] p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === t.id
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg border border-slate-700 bg-[#0f141c] p-1">
          {(["all", "player", "coach", "team"] as RoleFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                roleFilter === r
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {r === "all" ? "All Roles" : `${r}s`}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, event, competition..."
            className="w-64 rounded-lg border border-slate-700 bg-[#0f141c] py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

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
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-300">
            {statusFilter === "pending" ? "Queue is empty" : `No ${statusFilter} events`}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {statusFilter === "pending"
              ? "All submitted performance events have been reviewed."
              : "Try a different filter or check back later."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              expanded={expandedId === event.id}
              onToggleExpand={() => setExpandedId(expandedId === event.id ? null : event.id)}
              processing={processingId === event.id}
              rejecting={rejectingId === event.id}
              rejectNotes={rejectNotes}
              setRejectNotes={setRejectNotes}
              onApprove={() => handleApprove(event.id)}
              onStartReject={() => {
                setRejectingId(event.id);
                setRejectNotes("");
              }}
              onCancelReject={() => {
                setRejectingId(null);
                setRejectNotes("");
              }}
              onConfirmReject={() => handleReject(event.id)}
            />
          ))}
        </div>
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

// ─── Summary Card ───────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, color, bg,
}: {
  label: string;
  value: number;
  icon: typeof Clock;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn("rounded-xl border p-4", bg)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className={cn("mt-1 text-2xl font-black tabular-nums", color)}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

// ─── Event Row ──────────────────────────────────────────────────

function EventRow({
  event, expanded, onToggleExpand, processing, rejecting,
  rejectNotes, setRejectNotes, onApprove, onStartReject, onCancelReject, onConfirmReject,
}: {
  event: VerificationEvent;
  expanded: boolean;
  onToggleExpand: () => void;
  processing: boolean;
  rejecting: boolean;
  rejectNotes: string;
  setRejectNotes: (v: string) => void;
  onApprove: () => void;
  onStartReject: () => void;
  onCancelReject: () => void;
  onConfirmReject: () => void;
}) {
  const statusBadge = (status: string) => {
    if (status === "pending") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
    if (status === "verified") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
        <CheckCircle2 className="h-3 w-3" /> Verified
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400 uppercase">
        <XCircle className="h-3 w-3" /> Rejected
      </span>
    );
  };

  const sourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      "official":     "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      "api-provider": "bg-blue-500/15 text-blue-300 border-blue-500/30",
      "scout":        "bg-purple-500/15 text-purple-300 border-purple-500/30",
      "manual":       "bg-slate-700/40 text-slate-400 border-slate-700",
    };
    const cls = colors[source] ?? colors.manual;
    return (
      <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase", cls)}>
        {source}
      </span>
    );
  };

  const roleIcon = event.user.role === "player" ? "🏃"
    : event.user.role === "coach" ? "📋"
    : event.user.role === "team" ? "👥"
    : "👤";

  const roleLabel = event.user.role === "player"
    ? `${event.user.playerProfile?.position ?? "Player"}${event.user.playerProfile?.playerType ? ` · ${event.user.playerProfile.playerType}` : ""}`
    : event.user.role === "coach"
    ? `${event.user.coachProfile?.coachingRole ?? "Coach"}`
    : event.user.role === "team"
    ? `${event.user.teamProfile?.nickname ?? event.user.teamProfile?.league ?? "Team"}`
    : event.user.role;

  return (
    <div className={cn(
      "rounded-xl border bg-[#0f141c] transition-colors",
      event.verificationStatus === "pending"
        ? "border-amber-900/40"
        : event.verificationStatus === "verified"
        ? "border-emerald-900/30"
        : "border-rose-900/30"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggleExpand} className="text-slate-400 hover:text-white">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {event.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.user.avatarUrl}
              alt={event.user.name}
              className="h-10 w-10 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-sm font-bold text-white">
              {event.user.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Identity + event */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">{event.user.name}</span>
            <span className="text-[11px] text-slate-500">@{event.user.handle}</span>
            <span className="text-xs">{roleIcon}</span>
            <span className="text-[11px] text-slate-400">{roleLabel}</span>
            {sourceBadge(event.source)}
            {statusBadge(event.verificationStatus)}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
            <span className="font-mono text-amber-400">{event.eventType}</span>
            <span>× <span className="font-bold text-slate-200">{event.value}</span></span>
            <span className="text-slate-600">·</span>
            <span className={event.pointsCalculated >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {event.pointsCalculated >= 0 ? "+" : ""}{Math.round(event.pointsCalculated)} pts
            </span>
            {event.kpiConfig && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{event.kpiConfig.label}</span>
              </>
            )}
            {event.competition && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{event.competition}</span>
              </>
            )}
          </div>
        </div>

        {/* Match date */}
        <div className="text-right hidden md:block">
          <div className="text-xs text-slate-300">{formatDate(event.matchDate)}</div>
          <div className="text-[10px] text-slate-500">{formatRelativeTime(event.matchDate)}</div>
        </div>

        {/* Actions (only for pending) */}
        {event.verificationStatus === "pending" && !rejecting && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onApprove}
              disabled={processing}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Approve
            </button>
            <button
              onClick={onStartReject}
              disabled={processing}
              className="flex items-center gap-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/25 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        )}
      </div>

      {/* Reject input */}
      {rejecting && event.verificationStatus === "pending" && (
        <div className="border-t border-slate-800 p-4 bg-rose-950/10">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
            Rejection Reason (required)
          </label>
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Explain why this event is being rejected..."
            rows={2}
            autoFocus
            className="w-full rounded-md border border-rose-800 bg-[#0b0e14] px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={onCancelReject}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmReject}
              disabled={processing || !rejectNotes.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-rose-500/30 border border-rose-500/50 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-500/40 disabled:opacity-50"
            >
              {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Confirm Reject
            </button>
          </div>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DetailRow label="Event Type" value={event.eventType} icon={Activity} />
            <DetailRow label="Value" value={String(event.value)} icon={Trophy} />
            <DetailRow label="Points Calculated" value={`${event.pointsCalculated >= 0 ? "+" : ""}${Math.round(event.pointsCalculated)}`} icon={Trophy} />
            <DetailRow label="Match Date" value={formatDate(event.matchDate)} icon={Calendar} />
            <DetailRow label="Competition" value={event.competition ?? "—"} icon={Trophy} />
            <DetailRow label="Competition Tier" value={event.competitionTier ?? "—"} icon={Trophy} />
            <DetailRow label="Season" value={event.season ?? "—"} icon={Calendar} />
            <DetailRow label="Opponent" value={event.opponentName ?? "—"} icon={User} />
            <DetailRow label="Source" value={event.source} icon={FileText} />
            <DetailRow label="Match ID" value={event.matchId ?? event.matchExternalRef ?? "—"} icon={MapPin} />
            {event.opponentStrength != null && (
              <DetailRow label="Opponent Strength" value={`${(event.opponentStrength * 100).toFixed(0)}%`} icon={Activity} />
            )}
            {event.teamStrength != null && (
              <DetailRow label="Team Strength" value={`${(event.teamStrength * 100).toFixed(0)}%`} icon={Activity} />
            )}
          </div>

          {event.notes && (
            <div className="rounded-lg bg-slate-800/40 p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Submitter Notes</span>
              <p className="mt-1 text-slate-300">{event.notes}</p>
            </div>
          )}

          {/* Verification trail */}
          {event.verificationStatus !== "pending" && event.verification && (
            <div className="rounded-lg bg-slate-800/40 p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Verification Trail</span>
              <div className="mt-1 space-y-1 text-slate-300">
                <div>Status: <span className="font-bold capitalize">{event.verification.status}</span></div>
                <div>Verifier role: <span className="font-bold">{event.verification.verifierRole}</span></div>
                {event.verification.reviewedAt && (
                  <div>Reviewed: <span className="font-bold">{formatDate(event.verification.reviewedAt)}</span></div>
                )}
                {event.verification.notes && (
                  <div>Notes: <span className="italic">"{event.verification.notes}"</span></div>
                )}
                {event.rejectionReason && (
                  <div>Rejection reason: <span className="text-rose-300 italic">"{event.rejectionReason}"</span></div>
                )}
              </div>
            </div>
          )}

          {/* Point transactions (if verified) */}
          {event.pointTransactions.length > 0 && (
            <div className="rounded-lg bg-slate-800/40 p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Point Transactions</span>
              <div className="mt-1 space-y-1">
                {event.pointTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-slate-300">
                    <span>{formatDate(t.createdAt)}</span>
                    <span className={t.amount >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {t.amount >= 0 ? "+" : ""}{t.amount} pts
                    </span>
                    <span className="text-slate-500">balance: {t.balanceAfter.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anomaly warning */}
          {event.source === "manual" && event.verificationStatus === "pending" && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-950/30 border border-amber-900/40 p-2 text-amber-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-[11px]">
                Self-submitted event — verify the source before approving. Check match ID, opponent, and KPI value against official records.
              </span>
            </div>
          )}

          {/* Link to user profile */}
          <div className="flex justify-end">
            <a
              href={`/@${event.user.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              View user profile <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Detail Row ─────────────────────────────────────────────────

function DetailRow({
  label, value, icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-lg bg-slate-800/30 p-2">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-0.5 text-sm text-slate-200 truncate">{value}</div>
    </div>
  );
}

// ─── Date helpers ───────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
  } catch {
    return "";
  }
}

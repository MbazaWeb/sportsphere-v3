"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Link2, Trash2, RefreshCw } from "lucide-react";
import { adminFetch } from '@/lib/admin-api';

type Opt = { id: string; name: string; type?: string };

const TEAM_ROLES = ["sponsor", "partner", "owner", "kit_supplier", "media", "other"];
const PLAYER_ROLES = ["endorsement", "sponsor", "partner", "agency", "other"];
const COACH_ROLES = ["partner", "sponsor", "agency", "other"];

export default function BusinessLinksPage() {
  const [businesses, setBusinesses] = useState<Opt[]>([]);
  const [teams, setTeams] = useState<Opt[]>([]);
  const [players, setPlayers] = useState<Opt[]>([]);
  const [coaches, setCoaches] = useState<Opt[]>([]);
  const [links, setLinks] = useState<{ teams: any[]; players: any[]; coaches: any[] }>({
    teams: [],
    players: [],
    coaches: [],
  });

  const [entityType, setEntityType] = useState<"team" | "player" | "coach">("team");
  const [businessId, setBusinessId] = useState("");
  const [entityId, setEntityId] = useState("");
  const [role, setRole] = useState("sponsor");
  const [notes, setNotes] = useState("");
  const [filterBiz, setFilterBiz] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadOptions = useCallback(async () => {
    try {
      const [b, t, p, c] = await Promise.all([
        adminFetch("/api/admin/businesses").then((r) => r.json()),
        adminFetch("/api/admin/teams?limit=300").then((r) => r.json()),
        adminFetch("/api/admin/players?limit=300").then((r) => r.json()),
        adminFetch("/api/admin/coaches?limit=300").then((r) => r.json()),
      ]);
      setBusinesses((b.businesses || []).map((x: any) => ({ id: x.id, name: x.name, type: x.type })));
      setTeams((t.data || []).map((x: any) => ({ id: x.id, name: x.name })));
      setPlayers((p.data || p.players || []).map((x: any) => ({ id: x.id, name: x.name })));
      setCoaches((c.data || c.coaches || []).map((x: any) => ({ id: x.id, name: x.name })));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load options");
    }
  }, []);

  const loadLinks = useCallback(async () => {
    try {
      const q = filterBiz ? `?businessId=${encodeURIComponent(filterBiz)}` : "";
      const res = await adminFetch(`/api/admin/business-links${q}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to load links");
        return;
      }
      setLinks(data.links || { teams: [], players: [], coaches: [] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load links");
    }
  }, [filterBiz]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    if (entityType === "team") setRole("sponsor");
    else if (entityType === "player") setRole("endorsement");
    else setRole("partner");
    setEntityId("");
  }, [entityType]);

  const roles =
    entityType === "team" ? TEAM_ROLES : entityType === "player" ? PLAYER_ROLES : COACH_ROLES;
  const entityOptions =
    entityType === "team" ? teams : entityType === "player" ? players : coaches;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await adminFetch("/api/admin/business-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, businessId, entityId, role, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Save failed");
        return;
      }
      setMsg("Link saved");
      setNotes("");
      await loadLinks();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entityType: string, id: string) => {
    if (!confirm("Remove this link?")) return;
    const res = await adminFetch(`/api/admin/business-links?entityType=${entityType}&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) setErr(data.error || "Delete failed");
    else await loadLinks();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-violet-400" />
            Business Links
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Connect brands & media (Nike, BBC Sport, …) to teams, players, and coaches.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            loadOptions();
            loadLinks();
          }}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {err && (
        <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-sm">
          {err}
        </div>
      )}
      {msg && (
        <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-sm">
          {msg}
        </div>
      )}

      <form
        onSubmit={submit}
        className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Business *</span>
            <select
              required
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            >
              <option value="">— select —</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.type ? ` (${b.type})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Link to *</span>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            >
              <option value="team">Team</option>
              <option value="player">Player</option>
              <option value="coach">Coach / staff</option>
            </select>
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">
              {entityType === "team" ? "Team" : entityType === "player" ? "Player" : "Coach"} *
            </span>
            <select
              required
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            >
              <option value="">— select —</option>
              {entityOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1 md:col-span-2">
            <span className="text-slate-400 font-medium">Notes</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="optional"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving || !businessId || !entityId}
          className="px-5 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-200 font-semibold text-sm disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save link"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Filter by business:</span>
        <select
          value={filterBiz}
          onChange={(e) => setFilterBiz(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs"
        >
          <option value="">All</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {(["teams", "players", "coaches"] as const).map((key) => {
        const rows = links[key] || [];
        const label = key === "teams" ? "Team links" : key === "players" ? "Player links" : "Coach links";
        const et = key === "teams" ? "team" : key === "players" ? "player" : "coach";
        return (
          <div key={key} className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              {label} ({rows.length})
            </h2>
            {rows.length === 0 && <p className="text-xs text-slate-600">None yet.</p>}
            {rows.map((row: any) => {
              const bizName = row.Business?.name || row.businessId;
              const target =
                row.Team?.name || row.Player?.name || row.Coach?.name || "—";
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/50 text-sm"
                >
                  <div>
                    <div className="text-slate-100 font-medium">
                      {bizName} → {target}
                    </div>
                    <div className="text-xs text-slate-500">
                      {row.role}
                      {row.notes ? ` · ${row.notes}` : ""}
                      {row.isActive === false ? " · inactive" : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(et, row.id)}
                    className="text-xs px-2 py-1 rounded-lg border border-rose-500/40 text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

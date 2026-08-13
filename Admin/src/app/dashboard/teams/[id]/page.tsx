"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { displayPhoto } from "@/lib/placeholder-avatar";

type Member = {
  id: string;
  name: string;
  position?: string | null;
  role?: string | null;
  photoUrl?: string | null;
  shirtNumber?: number | null;
  nationality?: string | null;
  verified?: boolean;
};

type TeamDetail = {
  id: string;
  name: string;
  shortName?: string | null;
  city?: string | null;
  country?: string | null;
  venue?: string | null;
  logoUrl?: string | null;
  foundedYear?: number | null;
  description?: string | null;
  verified?: boolean;
  sportId?: string | null;
  leagueId?: string | null;
  League?: { id: string; name: string } | null;
  Sport?: { id: string; name: string } | null;
  Player?: Member[];
  Coach?: Member[];
};

const STAFF_ROLES = [
  { value: "head_coach", label: "Head coach" },
  { value: "assistant_coach", label: "Assistant coach" },
  { value: "goalkeeping_coach", label: "Goalkeeping coach" },
  { value: "fitness_coach", label: "Fitness coach" },
  { value: "analyst", label: "Analyst" },
  { value: "staff", label: "Other staff" },
];

export default function TeamRosterPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = String(params?.id || "");
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"player" | "coach" | "staff">("player");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    firstName: "",
    lastName: "",
    nationality: "",
    position: "",
    shirtNumber: "",
    photoUrl: "",
    role: "head_coach",
    description: "",
    verified: false,
  });

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to load team");
        setTeam(null);
        return;
      }
      setTeam(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const isPlayer = tab === "player";
      const url = isPlayer ? "/api/admin/players" : "/api/admin/coaches";
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        nationality: form.nationality.trim() || undefined,
        photoUrl: form.photoUrl.trim() || undefined,
        description: form.description.trim() || undefined,
        teamId,
        sportId: team?.sportId || undefined,
        leagueId: team?.leagueId || undefined,
        verified: form.verified,
      };
      if (isPlayer) {
        body.position = form.position.trim() || undefined;
        body.shirtNumber = form.shirtNumber || undefined;
      } else {
        body.role = tab === "staff" ? (form.role === "head_coach" ? "staff" : form.role) : form.role;
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to add member");
        return;
      }
      setMsg(`${isPlayer ? "Player" : "Coach/staff"} added: ${form.name}`);
      setForm({
        name: "",
        firstName: "",
        lastName: "",
        nationality: "",
        position: "",
        shirtNumber: "",
        photoUrl: "",
        role: tab === "staff" ? "staff" : "head_coach",
        description: "",
        verified: false,
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400 text-sm">Loading team…</p>;
  }
  if (!team) {
    return (
      <div className="space-y-3">
        <p className="text-red-300 text-sm">{err || "Team not found"}</p>
        <button onClick={() => router.push("/dashboard/create-team")} className="text-sky-300 text-sm underline">
          Back to create team
        </button>
      </div>
    );
  }

  const players = team.Player || [];
  const coaches = team.Coach || [];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start gap-4">
        <img
          src={displayPhoto(team.logoUrl, team.name)}
          alt=""
          className="h-16 w-16 rounded-xl object-cover border border-slate-700"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{team.name}</h1>
          <p className="text-sm text-slate-400">
            {[team.city, team.country].filter(Boolean).join(", ") || "No location"}
            {team.Sport?.name ? ` · ${team.Sport.name}` : ""}
            {team.League?.name ? ` · ${team.League.name}` : ""}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {players.length} players · {coaches.length} coaches/staff
            {!team.logoUrl ? " · using logo placeholder" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/create-team")}
          className="text-xs text-slate-400 hover:text-white"
        >
          + New team
        </button>
      </div>

      {msg && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{msg}</div>}
      {err && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>}

      {/* Roster lists */}
      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Players</h2>
          {players.length === 0 ? (
            <p className="text-xs text-slate-500">No players yet. Add below.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {players.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <img src={displayPhoto(p.photoUrl, p.name)} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white truncate">{p.shirtNumber != null ? `#${p.shirtNumber} ` : ""}{p.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{p.position || "—"}{p.nationality ? ` · ${p.nationality}` : ""}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Coaches & staff</h2>
          {coaches.length === 0 ? (
            <p className="text-xs text-slate-500">No coaches/staff yet. Add below.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {coaches.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <img src={displayPhoto(c.photoUrl, c.name)} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white truncate">{c.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{(c.role || "staff").replace(/_/g, " ")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Add form */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
        <div className="flex gap-2">
          {(["player", "coach", "staff"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                set("role", t === "staff" ? "staff" : "head_coach");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                tab === t
                  ? "bg-sky-500/20 border-sky-500/40 text-sky-200"
                  : "bg-slate-950 border-slate-700 text-slate-400"
              }`}
            >
              {t === "player" ? "Add player" : t === "coach" ? "Add coach" : "Add staff"}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Photo URL is optional — initials placeholder is used when empty. Only <strong className="text-slate-300">name</strong> is required.
        </p>
        <form onSubmit={addMember} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-xs space-y-1">
            <span className="text-slate-400">Full name *</span>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" />
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400">Nationality (optional)</span>
            <input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" />
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400">First name (optional)</span>
            <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" />
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400">Last name (optional)</span>
            <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" />
          </label>
          {tab === "player" && (
            <>
              <label className="block text-xs space-y-1">
                <span className="text-slate-400">Position (optional)</span>
                <input value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Midfielder" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" />
              </label>
              <label className="block text-xs space-y-1">
                <span className="text-slate-400">Shirt # (optional)</span>
                <input value={form.shirtNumber} onChange={(e) => set("shirtNumber", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" />
              </label>
            </>
          )}
          {tab !== "player" && (
            <label className="block text-xs space-y-1 md:col-span-2">
              <span className="text-slate-400">Role</span>
              <select value={form.role} onChange={(e) => set("role", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white">
                {STAFF_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs space-y-1 md:col-span-2">
            <span className="text-slate-400">Photo URL (optional)</span>
            <input value={form.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} placeholder="Leave empty for initials placeholder" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-2">
            <input type="checkbox" checked={form.verified} onChange={(e) => set("verified", e.target.checked)} />
            Mark verified
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="px-5 py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-200 font-semibold text-sm disabled:opacity-40"
            >
              {saving ? "Saving…" : tab === "player" ? "Add player to team" : tab === "coach" ? "Add coach to team" : "Add staff to team"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

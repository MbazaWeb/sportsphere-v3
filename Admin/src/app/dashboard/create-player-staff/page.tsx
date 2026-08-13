"use client";

import React, { useEffect, useState } from "react";

type Opt = { id: string; name: string };

const STAFF_ROLES = [
  { id: "player", label: "Player" },
  { id: "head_coach", label: "Head coach" },
  { id: "assistant_coach", label: "Assistant coach" },
  { id: "goalkeeping_coach", label: "Goalkeeping coach" },
  { id: "fitness_coach", label: "Fitness coach" },
  { id: "analyst", label: "Analyst" },
  { id: "staff", label: "Other staff" },
];

export default function CreatePlayerStaffPage() {
  const [teams, setTeams] = useState<Opt[]>([]);
  const [sports, setSports] = useState<Opt[]>([]);
  const [kind, setKind] = useState("player");
  const [form, setForm] = useState({
    name: "",
    firstName: "",
    lastName: "",
    position: "",
    nationality: "",
    shirtNumber: "",
    photoUrl: "",
    teamId: "",
    sportId: "",
    description: "",
    verified: false,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [t, s] = await Promise.all([
          fetch("/api/admin/teams?limit=200").then((r) => r.json()),
          fetch("/api/admin/sports").then((r) => r.json()),
        ]);
        setTeams((t.data || []).map((x: any) => ({ id: x.id, name: x.name })));
        setSports((s.sports || []).map((x: any) => ({ id: x.id, name: x.name })));
      } catch {}
    })();
  }, []);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const isPlayer = kind === "player";
      const url = isPlayer ? "/api/admin/players" : "/api/admin/coaches";
      const payload: any = {
        name: form.name,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        nationality: form.nationality || undefined,
        photoUrl: form.photoUrl || undefined,
        teamId: form.teamId || undefined,
        sportId: form.sportId || undefined,
        description: form.description || undefined,
        verified: form.verified,
      };
      if (isPlayer) {
        payload.position = form.position || undefined;
        payload.shirtNumber = form.shirtNumber || undefined;
      } else {
        payload.role = kind;
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed");
        return;
      }
      const created = data.player || data.coach;
      setMsg(`Created: ${created?.name} (${isPlayer ? "player" : kind})`);
      setForm((f) => ({ ...f, name: "", firstName: "", lastName: "", position: "", shirtNumber: "", description: "" }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: string, opts?: { placeholder?: string }) => (
    <label className="block text-xs space-y-1">
      <span className="text-slate-400 font-medium">{label}</span>
      <input
        value={String((form as any)[key] ?? "")}
        onChange={(e) => set(key, e.target.value)}
        placeholder={opts?.placeholder}
        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100"
      />
    </label>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Create Player & Staff</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add a player, head coach, assistant coach, or other staff member.
        </p>
      </div>
      {err && <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-sm">{err}</div>}
      {msg && <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-sm">{msg}</div>}
      <form onSubmit={submit} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <label className="block text-xs space-y-1">
          <span className="text-slate-400 font-medium">Type *</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {field("Full name *", "name", { placeholder: "Mikel Arteta" })}
          {field("First name", "firstName")}
          {field("Last name", "lastName")}
          {field("Nationality", "nationality")}
          {kind === "player" && field("Position", "position", { placeholder: "Midfielder" })}
          {kind === "player" && field("Shirt number", "shirtNumber")}
          {field("Photo URL", "photoUrl")}
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Team</span>
            <select
              value={form.teamId}
              onChange={(e) => set("teamId", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            >
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Sport</span>
            <select
              value={form.sportId}
              onChange={(e) => set("sportId", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            >
              <option value="">—</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1 md:col-span-2">
            <span className="text-slate-400 font-medium">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.verified} onChange={(e) => set("verified", e.target.checked)} />
            Mark verified
          </label>
        </div>
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="px-5 py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-200 font-semibold text-sm disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create"}
        </button>
      </form>
    </div>
  );
}

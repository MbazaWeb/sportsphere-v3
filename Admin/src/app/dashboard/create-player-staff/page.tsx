"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { displayPhoto } from "@/lib/placeholder-avatar";
import { adminFetch } from '@/lib/admin-api';

type Opt = { id: string; name: string };

const KINDS = [
  { id: "player", label: "Player" },
  { id: "head_coach", label: "Head coach" },
  { id: "assistant_coach", label: "Assistant coach" },
  { id: "goalkeeping_coach", label: "Goalkeeping coach" },
  { id: "fitness_coach", label: "Fitness coach" },
  { id: "staff", label: "Other staff" },
] as const;

export default function CreatePlayerStaffPage() {
  const router = useRouter();
  const [kind, setKind] = useState<string>("player");
  const [teams, setTeams] = useState<Opt[]>([]);
  const [sports, setSports] = useState<Opt[]>([]);
  const [form, setForm] = useState({
    name: "",
    firstName: "",
    lastName: "",
    nationality: "",
    countryCode: "",
    position: "",
    shirtNumber: "",
    photoUrl: "",
    teamId: "",
    sportId: "",
    description: "",
    heightCm: "",
    weightKg: "",
    verified: false,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [t, s] = await Promise.all([
          adminFetch("/api/admin/teams?limit=200").then((r) => r.json()),
          adminFetch("/api/admin/sports").then((r) => r.json()),
        ]);
        setTeams((t.data || t.teams || []).map((x: any) => ({ id: x.id, name: x.name })));
        setSports((s.sports || s.data || []).map((x: any) => ({ id: x.id, name: x.name })));
      } catch {}
    })();
  }, []);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const isPlayer = kind === "player";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const url = isPlayer ? "/api/admin/players" : "/api/admin/coaches";
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        nationality: form.nationality.trim() || undefined,
        countryCode: form.countryCode.trim() || undefined,
        photoUrl: form.photoUrl.trim() || undefined,
        teamId: form.teamId || undefined,
        sportId: form.sportId || undefined,
        description: form.description.trim() || undefined,
        verified: form.verified,
      };
      if (isPlayer) {
        body.position = form.position.trim() || undefined;
        body.shirtNumber = form.shirtNumber || undefined;
        body.heightCm = form.heightCm || undefined;
        body.weightKg = form.weightKg || undefined;
      } else {
        body.role = kind;
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Create failed");
        return;
      }
      const created = data.player || data.coach;
      setMsg(`Created ${isPlayer ? "player" : "coach/staff"}: ${created?.name || form.name}`);
      setForm((f) => ({
        ...f,
        name: "",
        firstName: "",
        lastName: "",
        position: "",
        shirtNumber: "",
        photoUrl: "",
        description: "",
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: string, opts?: { placeholder?: string; required?: boolean }) => (
    <label className="block text-xs space-y-1">
      <span className="text-slate-400 font-medium">
        {label}
        {opts?.required ? <span className="text-amber-400"> *</span> : <span className="text-slate-600"> (optional)</span>}
      </span>
      <input
        value={String((form as any)[key] ?? "")}
        onChange={(e) => set(key, e.target.value)}
        placeholder={opts?.placeholder}
        required={opts?.required}
        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
      />
    </label>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Player & Staff</h1>
        <p className="text-sm text-slate-400 mt-1">
          Photo URL is optional. Prefer creating a team first, then add members from the team roster page.
        </p>
      </div>

      {msg && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{msg}</div>}
      {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>}

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              kind === k.id ? "bg-sky-500/20 border-sky-500/40 text-sky-200" : "bg-slate-950 border-slate-700 text-slate-400"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex items-center gap-3">
          <img src={displayPhoto(form.photoUrl, form.name || "Person")} alt="" className="h-14 w-14 rounded-full object-cover border border-slate-700" />
          <p className="text-xs text-slate-500">Preview (placeholder if no photo URL)</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("Full name", "name", { required: true, placeholder: "John Doe" })}
          {field("Nationality", "nationality", { placeholder: "Kenya" })}
          {field("First name", "firstName")}
          {field("Last name", "lastName")}
          {field("Country code", "countryCode", { placeholder: "KE" })}
          {isPlayer && field("Position", "position", { placeholder: "Midfielder" })}
          {isPlayer && field("Shirt number", "shirtNumber")}
          {isPlayer && field("Height (cm)", "heightCm")}
          {isPlayer && field("Weight (kg)", "weightKg")}
          {field("Photo URL", "photoUrl", { placeholder: "Leave empty for initials" })}
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Team <span className="text-slate-600">(optional)</span></span>
            <select value={form.teamId} onChange={(e) => set("teamId", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white">
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Sport <span className="text-slate-600">(optional)</span></span>
            <select value={form.sportId} onChange={(e) => set("sportId", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white">
              <option value="">—</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1 md:col-span-2">
            <span className="text-slate-400 font-medium">Description <span className="text-slate-600">(optional)</span></span>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.verified} onChange={(e) => set("verified", e.target.checked)} />
            Mark verified
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving || !form.name.trim()} className="px-5 py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-200 font-semibold text-sm disabled:opacity-40">
            {saving ? "Creating…" : "Create"}
          </button>
          {form.teamId && (
            <button type="button" onClick={() => router.push(`/dashboard/teams/${form.teamId}`)} className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm">
              Open team roster
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

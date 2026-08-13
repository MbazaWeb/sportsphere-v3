"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Opt = { id: string; name: string };

const TYPES = [
  { id: "league", label: "League" },
  { id: "cup", label: "Cup" },
  { id: "tournament", label: "Tournament" },
  { id: "competition", label: "Competition" },
  { id: "international", label: "International" },
  { id: "friendly", label: "Friendly series" },
];

export default function CreateCompetitionPage() {
  const router = useRouter();
  const [sports, setSports] = useState<Opt[]>([]);
  const [teams, setTeams] = useState<Opt[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "league",
    country: "",
    countryCode: "",
    season: "",
    sportId: "",
    logoUrl: "",
    description: "",
    format: "",
    startDate: "",
    endDate: "",
    verified: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([
          fetch("/api/admin/sports", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/admin/teams?limit=300", { credentials: "include" }).then((r) => r.json()),
        ]);
        setSports((s.sports || s.data || []).map((x: any) => ({ id: x.id, name: x.name })));
        setTeams((t.data || t.teams || []).map((x: any) => ({ id: x.id, name: x.name })));
      } catch {}
    })();
  }, []);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const toggleTeam = (id: string) => {
    setSelectedTeams((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(teamFilter.toLowerCase())
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/admin/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          country: form.country.trim() || undefined,
          countryCode: form.countryCode.trim() || undefined,
          season: form.season.trim() || undefined,
          sportId: form.sportId || undefined,
          logoUrl: form.logoUrl.trim() || undefined,
          description: form.description.trim() || undefined,
          format: form.format.trim() || undefined,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          verified: form.verified,
          teamIds: selectedTeams,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to create");
        return;
      }
      setMsg(
        `Created ${form.type}: ${data.league?.name} with ${data.teamsAttached || 0} team(s)`
      );
      if (data.league?.id) {
        setTimeout(() => router.push(`/dashboard/leagues/${data.league.id}`), 600);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white";

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Competition / League</h1>
        <p className="text-sm text-slate-400 mt-1">
          Create a league, cup, or tournament, then attach teams. Live updates are broadcast over WebSocket.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {msg}
        </div>
      )}
      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block text-xs space-y-1 md:col-span-2">
              <span className="text-slate-400">Name *</span>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
                placeholder="Premier League / AFCON / Champions Cup"
              />
            </label>
            <label className="block text-xs space-y-1">
              <span className="text-slate-400">Type</span>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs space-y-1">
              <span className="text-slate-400">Sport</span>
              <select value={form.sportId} onChange={(e) => set("sportId", e.target.value)} className={inputCls}>
                <option value="">—</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs space-y-1">
              <span className="text-slate-400">Country</span>
              <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} placeholder="England" />
            </label>
            <label className="block text-xs space-y-1">
              <span className="text-slate-400">Country code</span>
              <input value={form.countryCode} onChange={(e) => set("countryCode", e.target.value)} className={inputCls} placeholder="GB" />
            </label>
            <label className="block text-xs space-y-1">
              <span className="text-slate-400">Season</span>
              <input value={form.season} onChange={(e) => set("season", e.target.value)} className={inputCls} placeholder="2025/26" />
            </label>
            <label className="block text-xs space-y-1">
              <span className="text-slate-400">Format</span>
              <input value={form.format} onChange={(e) => set("format", e.target.value)} className={inputCls} placeholder="Round robin / Knockout" />
            </label>
            <label className="block text-xs space-y-1">
              <span className="text-slate-400">Start date</span>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputCls} />
            </label>
            <label className="block text-xs space-y-1">
              <span className="text-slate-400">End date</span>
              <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputCls} />
            </label>
            <label className="block text-xs space-y-1 md:col-span-2">
              <span className="text-slate-400">Logo URL (optional)</span>
              <input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className={inputCls} />
            </label>
            <label className="block text-xs space-y-1 md:col-span-2">
              <span className="text-slate-400">Description</span>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls} />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.verified} onChange={(e) => set("verified", e.target.checked)} />
              Mark verified
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
              Add teams ({selectedTeams.length})
            </h2>
            <input
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              placeholder="Search teams…"
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white w-48"
            />
          </div>
          <p className="text-xs text-slate-500">
            Optional — you can add more teams later on the league page. Create teams first if the list is empty.
          </p>
          <div className="max-h-56 overflow-y-auto space-y-1 border border-slate-800 rounded-xl p-2">
            {filteredTeams.length === 0 && (
              <p className="text-xs text-slate-500 p-2">No teams found. Create teams first.</p>
            )}
            {filteredTeams.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 text-sm text-slate-200 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(t.id)}
                  onChange={() => toggleTeam(t.id)}
                />
                {t.name}
              </label>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-100 font-semibold text-sm disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create competition / league"}
        </button>
      </form>
    </div>
  );
}

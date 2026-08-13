"use client";

import React, { useEffect, useState } from "react";

type Opt = { id: string; name: string };

export default function CreateTeamPage() {
  const [sports, setSports] = useState<Opt[]>([]);
  const [leagues, setLeagues] = useState<Opt[]>([]);
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    city: "",
    country: "",
    venue: "",
    foundedYear: "",
    logoUrl: "",
    sportId: "",
    leagueId: "",
    description: "",
    verified: false,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, l] = await Promise.all([
          fetch("/api/admin/sports").then((r) => r.json()),
          fetch("/api/admin/leagues?limit=100").then((r) => r.json()),
        ]);
        setSports((s.sports || []).map((x: any) => ({ id: x.id, name: x.name })));
        setLeagues((l.data || l.leagues || []).map((x: any) => ({ id: x.id, name: x.name })));
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
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          foundedYear: form.foundedYear || undefined,
          sportId: form.sportId || undefined,
          leagueId: form.leagueId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed");
        return;
      }
      setMsg(`Team created: ${data.team?.name}`);
      setForm((f) => ({ ...f, name: "", shortName: "", description: "" }));
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
        <h1 className="text-2xl font-bold text-slate-100">Create Team</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manually add a club or national team to the structured entity graph.
        </p>
      </div>
      {err && <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-sm">{err}</div>}
      {msg && <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-sm">{msg}</div>}
      <form onSubmit={submit} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {field("Team name *", "name", { placeholder: "Arsenal FC" })}
          {field("Short name", "shortName", { placeholder: "Arsenal" })}
          {field("City", "city")}
          {field("Country", "country")}
          {field("Venue", "venue")}
          {field("Founded year", "foundedYear", { placeholder: "1886" })}
          {field("Logo URL", "logoUrl")}
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
            <span className="text-slate-400 font-medium">League</span>
            <select
              value={form.leagueId}
              onChange={(e) => set("leagueId", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            >
              <option value="">—</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
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
          className="px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-semibold text-sm disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create team"}
        </button>
      </form>
    </div>
  );
}

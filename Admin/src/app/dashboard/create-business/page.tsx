"use client";

import React, { useEffect, useState } from "react";

const TYPES = [
  { id: "brand", label: "Brand (e.g. Nike Sport)" },
  { id: "media", label: "Media (e.g. BBC Sport)" },
  { id: "sponsor", label: "Sponsor" },
  { id: "agency", label: "Agency" },
  { id: "club_partner", label: "Club partner" },
  { id: "other", label: "Other" },
];

export default function CreateBusinessPage() {
  const [form, setForm] = useState({
    name: "",
    type: "brand",
    website: "",
    logoUrl: "",
    country: "",
    description: "",
    verified: false,
  });
  const [list, setList] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/businesses");
      const data = await res.json();
      if (res.ok) setList(data.businesses || []);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed");
        return;
      }
      setMsg(`Business created: ${data.business?.name}`);
      setForm((f) => ({ ...f, name: "", website: "", description: "" }));
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Create Business</h1>
        <p className="text-sm text-slate-500 mt-1">
          Brands, media, sponsors — e.g. Nike Sport, BBC Sport.
        </p>
      </div>
      {err && <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-sm">{err}</div>}
      {msg && <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-sm">{msg}</div>}
      <form onSubmit={submit} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-xs space-y-1 md:col-span-2">
            <span className="text-slate-400 font-medium">Business name *</span>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nike Sport"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Type</span>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Country</span>
            <input
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
          </label>
          <label className="block text-xs space-y-1 md:col-span-2">
            <span className="text-slate-400 font-medium">Website</span>
            <input
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
          </label>
          <label className="block text-xs space-y-1 md:col-span-2">
            <span className="text-slate-400 font-medium">Logo URL</span>
            <input
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
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
          className="px-5 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-200 font-semibold text-sm disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create business"}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent businesses</h2>
        {list.length === 0 && <p className="text-xs text-slate-600">None yet.</p>}
        {list.map((b) => (
          <div key={b.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 text-sm flex justify-between gap-2">
            <div>
              <div className="text-slate-100 font-medium">{b.name}</div>
              <div className="text-xs text-slate-500">{b.type} · {b.country || "—"} · {b.website || "no site"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { displayPhoto } from "@/lib/placeholder-avatar";
import { adminFetch } from '@/lib/admin-api';

type Opt = { id: string; name: string };

export default function CreateTeamPage() {
  const router = useRouter();
  const [sports, setSports] = useState<Opt[]>([]);
  const [leagues, setLeagues] = useState<Opt[]>([]);
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    city: "",
    country: "",
    countryCode: "",
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
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, l] = await Promise.all([
          adminFetch("/api/admin/sports").then((r) => r.json()),
          adminFetch("/api/admin/leagues?limit=200").then((r) => r.json()),
        ]);
        setSports((s.sports || s.data || []).map((x: any) => ({ id: x.id, name: x.name })));
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
      const res = await adminFetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          shortName: form.shortName.trim() || undefined,
          city: form.city.trim() || undefined,
          country: form.country.trim() || undefined,
          countryCode: form.countryCode.trim() || undefined,
          venue: form.venue.trim() || undefined,
          foundedYear: form.foundedYear || undefined,
          logoUrl: form.logoUrl.trim() || undefined,
          sportId: form.sportId || undefined,
          leagueId: form.leagueId || undefined,
          description: form.description.trim() || undefined,
          verified: form.verified,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to create team");
        return;
      }
      const id = data.team?.id;
      setCreatedId(id || null);
      setMsg(`Team created: ${data.team?.name}. Logo is optional — a placeholder is used when empty.`);
      if (id) {
        // Stay on success so admin can jump to roster
      }
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
        {opts?.required ? <span className="text-amber-400"> *</span> : (
          <span className="text-slate-600 font-normal"> (optional)</span>
        )}
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

  const previewLogo = displayPhoto(form.logoUrl, form.name || "Team");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Team</h1>
        <p className="text-sm text-slate-400 mt-1">
          Logo URL is optional. If empty, the app shows an initials placeholder. After create, add players, coaches, and staff on the team roster.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 space-y-2">
          <p>{msg}</p>
          {createdId && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/teams/${createdId}`)}
              className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 font-semibold text-emerald-100"
            >
              Add players, coaches & staff →
            </button>
          )}
        </div>
      )}
      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>
      )}

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex items-center gap-4">
          <img src={previewLogo} alt="" className="h-16 w-16 rounded-xl object-cover border border-slate-700 bg-slate-800" />
          <p className="text-xs text-slate-500">Live logo preview (placeholder if no URL)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("Team name", "name", { placeholder: "Arsenal FC", required: true })}
          {field("Short name", "shortName", { placeholder: "ARS" })}
          {field("City", "city", { placeholder: "London" })}
          {field("Country", "country", { placeholder: "England" })}
          {field("Country code", "countryCode", { placeholder: "GB" })}
          {field("Venue / stadium", "venue", { placeholder: "Emirates Stadium" })}
          {field("Founded year", "foundedYear", { placeholder: "1886" })}
          {field("Logo URL", "logoUrl", { placeholder: "https://… (leave empty for placeholder)" })}
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Sport <span className="text-slate-600">(optional)</span></span>
            <select
              value={form.sportId}
              onChange={(e) => set("sportId", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            >
              <option value="">—</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">League <span className="text-slate-600">(optional)</span></span>
            <select
              value={form.leagueId}
              onChange={(e) => set("leagueId", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            >
              <option value="">—</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1 md:col-span-2">
            <span className="text-slate-400 font-medium">Description <span className="text-slate-600">(optional)</span></span>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-2">
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

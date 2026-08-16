#!/usr/bin/env python3
"""
1. Add DELETE method to leagues/[id]/route.ts
2. Rewrite create-competition page to show existing leagues table with Edit/Delete/Add Team
"""
import paramiko

HOST, USER, PASS = '104.152.50.173', 'deploy', 'Rehema@1234!'
API_FILE = '/var/www/sportsphere-nextjs/Admin/src/app/api/admin/leagues/[id]/route.ts'
PAGE_FILE = '/var/www/sportsphere-nextjs/Admin/src/app/dashboard/create-competition/page.tsx'

def ssh_cmd(cmd, timeout=60):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=timeout)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    client.close()
    return out, err

# ═══════════════════════════════════════════════════
# PART 1: Add DELETE method to leagues/[id]/route.ts
# ═══════════════════════════════════════════════════
print("=== PART 1: Add DELETE to leagues API ===")
api_content, _ = ssh_cmd(f'cat {API_FILE}')

delete_method = '''

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.league.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Detach all teams from this league
    await db.team.updateMany({
      where: { leagueId: id },
      data: { leagueId: null, updatedAt: new Date() },
    });

    // Delete the league
    await db.league.delete({ where: { id } });

    try {
      await db.auditLog.create({
        data: {
          actorId: auth.user.sub,
          action: 'league.delete',
          module: 'sports-data',
          targetId: id,
          targetType: 'League',
          newValue: { name: existing.name } as any,
        },
      });
    } catch { /* optional */ }

    realtime.leagueUpdate(id, { id, action: 'deleted', name: existing.name });

    return NextResponse.json({ ok: true, deleted: existing.name });
  } catch (error) {
    console.error('Failed to delete league:', error);
    return NextResponse.json(
      { error: 'Failed to delete league', detail: String(error) },
      { status: 500 }
    );
  }
}'''

# Insert DELETE before the closing of the file (after the last closing brace of PATCH)
api_content = api_content.rstrip() + "\n" + delete_method

encoded = api_content.encode('utf-8').hex()
ssh_cmd(f"echo '{encoded}' | xxd -r -p > {API_FILE}")
print("✅ DELETE method added to leagues API")

# ═══════════════════════════════════════════════════
# PART 2: Rewrite create-competition page
# ═══════════════════════════════════════════════════
print("\n=== PART 2: Add leagues table to page ===")

new_page = r'''"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Opt = { id: string; name: string; countryCode?: string; country?: string; slug?: string; icon?: string };
type LeagueRow = {
  id: string;
  name: string;
  type: string;
  country: string | null;
  countryCode: string | null;
  season: string | null;
  sportId: string | null;
  Sport?: { id: string; name: string; icon: string | null } | null;
  _count?: { Team: number };
  Team?: { id: string; name: string }[];
};

const TYPES = [
  { id: "league", label: "League" },
  { id: "cup", label: "Cup" },
  { id: "tournament", label: "Tournament" },
  { id: "championship", label: "Championship" },
  { id: "competition", label: "Competition" },
  { id: "international", label: "International" },
  { id: "friendly", label: "Friendly series" },
];

const COUNTRIES = [
  { code: "TZ", name: "Tanzania" },
  { code: "AF", name: "Africa" },
  { code: "UNI", name: "University" },
  { code: "COL", name: "College" },
  { code: "SCH", name: "School" },
  { code: "STR", name: "Street / Community" },
];

export default function CreateCompetitionPage() {
  const router = useRouter();
  const [sports, setSports] = useState<Opt[]>([]);
  const [teams, setTeams] = useState<Opt[]>([]);
  const [allLeagues, setAllLeagues] = useState<LeagueRow[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [nameSearchOpen, setNameSearchOpen] = useState(false);
  const nameInputRef = useRef<HTMLDivElement>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [addTeamModal, setAddTeamModal] = useState<string | null>(null);
  const [addTeamSearch, setAddTeamSearch] = useState("");
  const [addTeamSelected, setAddTeamSelected] = useState<string[]>([]);

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

  const fetchLeagues = async () => {
    try {
      const res = await fetch("/api/admin/leagues?limit=500");
      const data = await res.json();
      setAllLeagues((data.data || data.leagues || []).map((x: any) => ({
        id: x.id,
        name: x.name,
        type: x.type || "league",
        country: x.country || null,
        countryCode: x.countryCode || null,
        season: x.season || null,
        sportId: x.sportId || null,
        Sport: x.Sport || null,
        _count: x._count || { Team: 0 },
        Team: x.Team || [],
      })));
    } catch {}
  };

  // Fetch sports, teams, and all leagues on mount
  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([
          fetch("/api/admin/sports").then((r) => r.json()),
          fetch("/api/admin/teams?limit=300").then((r) => r.json()),
        ]);
        setSports((s.sports || s.data || []).map((x: any) => ({ id: x.id, name: x.name, icon: x.icon })));
        setTeams((t.data || t.teams || []).map((x: any) => ({ id: x.id, name: x.name })));
      } catch {}
      await fetchLeagues();
    })();
  }, []);

  // Duplicate check against existing competitions
  useEffect(() => {
    if (!form.name.trim()) { setDuplicateWarning(null); return; }
    const match = allLeagues.find(
      (l) => l.name.toLowerCase() === form.name.trim().toLowerCase()
    );
    if (match) {
      setDuplicateWarning(`A competition named "${form.name.trim()}" already exists.`);
    } else {
      setDuplicateWarning(null);
    }
  }, [form.name, allLeagues]);

  // Close name search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (nameInputRef.current && !nameInputRef.current.contains(e.target as Node)) setNameSearchOpen(false);
    };
    if (nameSearchOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [nameSearchOpen]);

  // Filtered existing leagues based on name input
  const nameSuggestions = form.name.trim().length >= 1
    ? allLeagues
        .filter((l) => l.name.toLowerCase().includes(form.name.trim().toLowerCase()))
        .slice(0, 6)
    : [];

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
      setMsg(`Created ${form.type}: ${data.league?.name} with ${data.teamsAttached || 0} team(s)`);
      setForm({ name: "", type: "league", country: "", countryCode: "", season: "", sportId: "", logoUrl: "", description: "", format: "", startDate: "", endDate: "", verified: false });
      setSelectedTeams([]);
      await fetchLeagues();
    } catch (e: any) {
      setErr(e.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/leagues/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Delete failed"); return; }
      setMsg(`Deleted: ${name}`);
      setDeleteConfirm(null);
      await fetchLeagues();
    } catch (e: any) {
      setErr(e.message || "Network error");
    }
  };

  const handleAddTeams = async (leagueId: string) => {
    if (addTeamSelected.length === 0) return;
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "add_teams", teamIds: addTeamSelected }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Failed to add teams"); return; }
      setMsg(`Added ${addTeamSelected.length} team(s) to league`);
      setAddTeamModal(null);
      setAddTeamSelected([]);
      setAddTeamSearch("");
      await fetchLeagues();
    } catch (e: any) {
      setErr(e.message || "Network error");
    }
  };

  // Filtered leagues for the table
  const tableFiltered = tableSearch.trim()
    ? allLeagues.filter((l) =>
        l.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (l.country || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
        (l.type || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
        (l.Sport?.name || "").toLowerCase().includes(tableSearch.toLowerCase())
      )
    : allLeagues;

  const inputCls = "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white";

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      {/* ── CREATE FORM ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Create Competition / League</h1>
        <p className="text-sm text-slate-400 mt-1">
          Create a league, cup, or tournament, then attach teams.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-emerald-400 hover:text-emerald-200 ml-2">&times;</button>
        </div>
      )}
      {duplicateWarning && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          ⚠️ {duplicateWarning} This will create a duplicate if you continue.
        </div>
      )}
      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200 flex items-center justify-between">
          <span>{err}</span>
          <button onClick={() => setErr(null)} className="text-red-400 hover:text-red-200 ml-2">&times;</button>
        </div>
      )}

      <details open className="group">
        <summary className="cursor-pointer text-lg font-semibold text-amber-300 flex items-center gap-2 select-none">
          <svg className="h-5 w-5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="m9 18 6-6-6-6" />
          </svg>
          New Competition / League
        </summary>

        <form onSubmit={submit} className="space-y-5 mt-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block text-xs space-y-1 md:col-span-2">
                <span className="text-slate-400">League / Competition Name *</span>
                <div className="relative" ref={nameInputRef}>
                  <input required value={form.name}
                    onChange={(e) => { set("name", e.target.value); setNameSearchOpen(true); }}
                    onFocus={() => setNameSearchOpen(true)}
                    className={inputCls + " pr-8"}
                    placeholder="Type to search existing or enter new name..." />
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  {nameSearchOpen && nameSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/50">
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider border-b border-slate-800">
                        Existing Competitions ({allLeagues.filter((l) => l.name.toLowerCase().includes(form.name.trim().toLowerCase())).length})
                      </div>
                      {nameSuggestions.map((l) => (
                        <button key={l.id} type="button"
                          onClick={() => { set("name", l.name); setNameSearchOpen(false); }}
                          className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-amber-500/10 hover:text-amber-100 transition-colors flex items-center gap-2 border-b border-slate-800/50 last:border-0">
                          <svg className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {l.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {nameSearchOpen && form.name.trim().length >= 1 && nameSuggestions.length === 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/50 px-3 py-2.5 text-xs text-slate-400">
                      No existing match — this will create a new competition
                    </div>
                  )}
                </div>
              </label>
              <label className="block text-xs space-y-1">
                <span className="text-slate-400">Type</span>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
                  {TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
                </select>
              </label>
              <label className="block text-xs space-y-1">
                <span className="text-slate-400">Sport <span className="text-amber-400">*</span></span>
                <select value={form.sportId} onChange={(e) => set("sportId", e.target.value)} className={inputCls}>
                  <option value="">— pick a sport —</option>
                  {sports.map((s) => (<option key={s.id} value={s.id}>{s.icon} {s.name}</option>))}
                </select>
              </label>
              <label className="block text-xs space-y-1">
                <span className="text-slate-400">Region / Country</span>
                <select value={form.countryCode} onChange={(e) => {
                  const c = COUNTRIES.find((x) => x.code === e.target.value);
                  setForm((f) => ({ ...f, countryCode: e.target.value, country: c ? c.name : "" }));
                }} className={inputCls}>
                  <option value="">— select region —</option>
                  {COUNTRIES.map((c) => (<option key={c.code} value={c.code}>{c.name}</option>))}
                </select>
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
              <label className="block text-xs space-y-1">
                <span className="text-slate-400">Logo URL (optional)</span>
                <input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className={inputCls} />
              </label>
              <label className="block text-xs space-y-1">
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
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Add teams ({selectedTeams.length})</h2>
              <input value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} placeholder="Search teams…"
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white w-48" />
            </div>
            <p className="text-xs text-slate-500">Optional — you can add teams later from the table below.</p>
            <div className="max-h-56 overflow-y-auto space-y-1 border border-slate-800 rounded-xl p-2">
              {filteredTeams.length === 0 && <p className="text-xs text-slate-500 p-2">No teams found.</p>}
              {filteredTeams.map((t) => (
                <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 text-sm text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={selectedTeams.includes(t.id)} onChange={() => toggleTeam(t.id)} />
                  {t.name}
                </label>
              ))}
            </div>
          </section>

          <button type="submit" disabled={saving || !form.name.trim()}
            className="px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-100 font-semibold text-sm disabled:opacity-40 hover:bg-amber-500/30 transition-colors">
            {saving ? "Creating…" : "Create competition / league"}
          </button>
        </form>
      </details>

      {/* ── EXISTING LEAGUES TABLE ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-bold text-white">
            Existing Competitions
            <span className="ml-2 text-sm font-normal text-slate-400">({tableFiltered.length} of {allLeagues.length})</span>
          </h2>
          <input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Search competitions…"
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white w-full sm:w-56" />
        </div>

        {tableFiltered.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-500">
            {allLeagues.length === 0 ? "No competitions created yet. Use the form above to create one." : "No competitions match your search."}
          </div>
        ) : (
          <div className="space-y-2">
            {tableFiltered.map((league) => (
              <div key={league.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate">{league.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 uppercase font-medium">{league.type || "league"}</span>
                      {league.season && <span className="text-[10px] text-slate-500">{league.season}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      {league.Sport && <span>{league.Sport.icon} {league.Sport.name}</span>}
                      {league.country && <span>📍 {league.country}</span>}
                      <span>👥 {league._count?.Team || 0} teams</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => router.push(`/dashboard/leagues/${league.id}`)}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-medium hover:bg-sky-500/20 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => { setAddTeamModal(league.id); setAddTeamSearch(""); setAddTeamSelected([]); }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                      + Team
                    </button>
                    {deleteConfirm === league.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(league.id, league.name)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors">
                          Confirm
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs hover:text-white transition-colors">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(league.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium hover:bg-red-500/20 transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD TEAM MODAL ── */}
      {addTeamModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setAddTeamModal(null); }}>
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-amber-300">Add Teams to League</h3>
              <button onClick={() => setAddTeamModal(null)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>

            <input value={addTeamSearch} onChange={(e) => setAddTeamSearch(e.target.value)} placeholder="Search teams…"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white mb-3" />

            <div className="max-h-52 overflow-y-auto space-y-1 border border-slate-800 rounded-xl p-2 mb-4">
              {teams
                .filter((t) => !addTeamSelected.includes(t.id) && t.name.toLowerCase().includes(addTeamSearch.toLowerCase()))
                .slice(0, 20)
                .map((t) => (
                  <button key={t.id} type="button"
                    onClick={() => setAddTeamSelected((p) => [...p, t.id])}
                    className="w-full px-3 py-2 text-left text-sm text-slate-200 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-200 transition-colors flex items-center gap-2">
                    <span className="text-emerald-400">+</span> {t.name}
                  </button>
                ))}
              {teams.filter((t) => !addTeamSelected.includes(t.id) && t.name.toLowerCase().includes(addTeamSearch.toLowerCase())).length === 0 && (
                <p className="text-xs text-slate-500 p-2">No teams found.</p>
              )}
            </div>

            {addTeamSelected.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2">Selected ({addTeamSelected.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {addTeamSelected.map((tid) => {
                    const team = teams.find((t) => t.id === tid);
                    return (
                      <span key={tid} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                        {team?.name || tid}
                        <button type="button" onClick={() => setAddTeamSelected((p) => p.filter((x) => x !== tid))} className="text-emerald-400 hover:text-white">&times;</button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={() => handleAddTeams(addTeamModal)}
              disabled={addTeamSelected.length === 0}
              className="w-full px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-semibold text-sm disabled:opacity-40 hover:bg-emerald-500/30 transition-colors">
              Add {addTeamSelected.length} Team{addTeamSelected.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
'''

# Write the new page
encoded = new_page.encode('utf-8').hex()
ssh_cmd(f"echo '{encoded}' | xxd -r -p > {PAGE_FILE}")
print(f"✅ Page rewritten: {len(new_page)} chars")
print("\nAll done!")

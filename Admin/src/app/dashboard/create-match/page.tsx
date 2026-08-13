"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Opt = { id: string; name: string };
type EventRow = {
  minute: string;
  type: string;
  player: string;
  team: "home" | "away";
  detail: string;
};

const STATUSES = [
  { id: "upcoming", label: "Upcoming" },
  { id: "live", label: "Live" },
  { id: "ht", label: "Half-time" },
  { id: "ft", label: "Full-time / Result" },
  { id: "postponed", label: "Postponed" },
  { id: "cancelled", label: "Cancelled" },
];

const EVENT_TYPES = [
  "goal", "own_goal", "penalty", "yellow_card", "red_card", "substitution", "var",
];

const emptyEvent = (): EventRow => ({
  minute: "",
  type: "goal",
  player: "",
  team: "home",
  detail: "",
});

export default function CreateMatchPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Opt[]>([]);
  const [leagues, setLeagues] = useState<Opt[]>([]);
  const [sports, setSports] = useState<Opt[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    homeTeamId: "",
    awayTeamId: "",
    homeTeamName: "",
    awayTeamName: "",
    homeScore: "",
    awayScore: "",
    status: "upcoming",
    minute: "",
    period: "",
    venue: "",
    kickoffDate: "",
    kickoffTime: "15:00",
    leagueId: "",
    sportId: "",
    leagueName: "",
    continent: "Europe",
    country: "",
    referee: "",
    attendance: "",
    notes: "",
    homeCoach: "",
    awayCoach: "",
    publishToFan: true,
  });

  const [events, setEvents] = useState<EventRow[]>([]);
  const [homeLineup, setHomeLineup] = useState("");
  const [awayLineup, setAwayLineup] = useState("");
  const [statsText, setStatsText] = useState(
    '{\n  "possession": {"home": 50, "away": 50},\n  "shots": {"home": 0, "away": 0},\n  "shotsOnTarget": {"home": 0, "away": 0},\n  "corners": {"home": 0, "away": 0},\n  "fouls": {"home": 0, "away": 0}\n}'
  );

  useEffect(() => {
    (async () => {
      try {
        const [t, l, s] = await Promise.all([
          fetch("/api/admin/teams?limit=300").then((r) => r.json()),
          fetch("/api/admin/leagues?limit=200").then((r) => r.json()),
          fetch("/api/admin/sports").then((r) => r.json()),
        ]);
        setTeams((t.data || t.teams || []).map((x: any) => ({ id: x.id, name: x.name })));
        setLeagues((l.data || l.leagues || []).map((x: any) => ({ id: x.id, name: x.name })));
        setSports((s.sports || s.data || []).map((x: any) => ({ id: x.id, name: x.name })));
      } catch {}
    })();
    // default kickoff = tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setForm((f) => ({ ...f, kickoffDate: d.toISOString().slice(0, 10) }));
  }, []);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  // When selecting team from dropdown, fill name
  useEffect(() => {
    if (form.homeTeamId) {
      const t = teams.find((x) => x.id === form.homeTeamId);
      if (t) set("homeTeamName", t.name);
    }
  }, [form.homeTeamId, teams]);
  useEffect(() => {
    if (form.awayTeamId) {
      const t = teams.find((x) => x.id === form.awayTeamId);
      if (t) set("awayTeamName", t.name);
    }
  }, [form.awayTeamId, teams]);
  useEffect(() => {
    if (form.leagueId) {
      const l = leagues.find((x) => x.id === form.leagueId);
      if (l) set("leagueName", l.name);
    }
  }, [form.leagueId, leagues]);

  const kickoffISO = useMemo(() => {
    if (!form.kickoffDate) return "";
    const time = form.kickoffTime || "00:00";
    // treat as local → ISO
    const dt = new Date(`${form.kickoffDate}T${time}:00`);
    return Number.isNaN(dt.getTime()) ? "" : dt.toISOString();
  }, [form.kickoffDate, form.kickoffTime]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      if (!form.homeTeamName.trim() || !form.awayTeamName.trim()) {
        setErr("Home and away team names are required");
        setSaving(false);
        return;
      }
      if (!kickoffISO) {
        setErr("Valid kickoff date/time required");
        setSaving(false);
        return;
      }

      let stats = {};
      try {
        stats = statsText.trim() ? JSON.parse(statsText) : {};
      } catch {
        setErr("Stats JSON is invalid");
        setSaving(false);
        return;
      }

      const payload = {
        homeTeamId: form.homeTeamId || undefined,
        awayTeamId: form.awayTeamId || undefined,
        homeTeamName: form.homeTeamName.trim(),
        awayTeamName: form.awayTeamName.trim(),
        homeScore: form.homeScore === "" ? null : Number(form.homeScore),
        awayScore: form.awayScore === "" ? null : Number(form.awayScore),
        status: form.status,
        minute: form.minute === "" ? null : Number(form.minute),
        period: form.period || undefined,
        venue: form.venue.trim() || undefined,
        kickoffAt: kickoffISO,
        leagueId: form.leagueId || undefined,
        sportId: form.sportId || undefined,
        leagueName: form.leagueName.trim() || undefined,
        continent: form.continent,
        country: form.country.trim() || undefined,
        referee: form.referee.trim() || undefined,
        attendance: form.attendance === "" ? null : Number(form.attendance),
        notes: form.notes.trim() || undefined,
        coaches: {
          home: form.homeCoach.trim() || undefined,
          away: form.awayCoach.trim() || undefined,
        },
        lineups: {
          home: homeLineup
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          away: awayLineup
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        stats,
        events: events
          .filter((ev) => ev.player.trim() || ev.type)
          .map((ev) => ({
            minute: ev.minute === "" ? 0 : Number(ev.minute),
            type: ev.type,
            player: ev.player.trim(),
            team: ev.team,
            detail: ev.detail.trim() || undefined,
          })),
        publishToFan: form.publishToFan,
      };

      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to create match");
        return;
      }
      setCreatedId(data.matchProfile?.id || null);
      setMsg(
        `Match created: ${payload.homeTeamName} vs ${payload.awayTeamName}` +
          (data.fanMatch ? " — published to fan app" : "")
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white";
  const labelCls = "block text-xs space-y-1";

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Match</h1>
        <p className="text-sm text-slate-400 mt-1">
          Full match card: teams, kickoff, venue, scores, live minute, events, lineups, stats.
          Saved to database and published to the fan Scores tab when enabled.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 space-y-2">
          <p>{msg}</p>
          {createdId && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/matches/${createdId}`)}
              className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 font-semibold"
            >
              Open match live editor →
            </button>
          )}
        </div>
      )}
      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* Teams */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Teams</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold">HOME</p>
              <label className={labelCls}>
                <span className="text-slate-400">Select team (optional)</span>
                <select value={form.homeTeamId} onChange={(e) => set("homeTeamId", e.target.value)} className={inputCls}>
                  <option value="">— type name below —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label className={labelCls}>
                <span className="text-slate-400">Home team name *</span>
                <input required value={form.homeTeamName} onChange={(e) => set("homeTeamName", e.target.value)} className={inputCls} placeholder="Arsenal" />
              </label>
              <label className={labelCls}>
                <span className="text-slate-400">Home coach (optional)</span>
                <input value={form.homeCoach} onChange={(e) => set("homeCoach", e.target.value)} className={inputCls} />
              </label>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold">AWAY</p>
              <label className={labelCls}>
                <span className="text-slate-400">Select team (optional)</span>
                <select value={form.awayTeamId} onChange={(e) => set("awayTeamId", e.target.value)} className={inputCls}>
                  <option value="">— type name below —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label className={labelCls}>
                <span className="text-slate-400">Away team name *</span>
                <input required value={form.awayTeamName} onChange={(e) => set("awayTeamName", e.target.value)} className={inputCls} placeholder="Chelsea" />
              </label>
              <label className={labelCls}>
                <span className="text-slate-400">Away coach (optional)</span>
                <input value={form.awayCoach} onChange={(e) => set("awayCoach", e.target.value)} className={inputCls} />
              </label>
            </div>
          </div>
        </section>

        {/* Schedule & venue */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Schedule & venue</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <label className={labelCls}>
              <span className="text-slate-400">Kickoff date *</span>
              <input type="date" required value={form.kickoffDate} onChange={(e) => set("kickoffDate", e.target.value)} className={inputCls} />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Kickoff time *</span>
              <input type="time" required value={form.kickoffTime} onChange={(e) => set("kickoffTime", e.target.value)} className={inputCls} />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Venue</span>
              <input value={form.venue} onChange={(e) => set("venue", e.target.value)} className={inputCls} placeholder="Emirates Stadium" />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">League</span>
              <select value={form.leagueId} onChange={(e) => set("leagueId", e.target.value)} className={inputCls}>
                <option value="">—</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">League name (override)</span>
              <input value={form.leagueName} onChange={(e) => set("leagueName", e.target.value)} className={inputCls} placeholder="Premier League" />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Sport</span>
              <select value={form.sportId} onChange={(e) => set("sportId", e.target.value)} className={inputCls}>
                <option value="">—</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Country</span>
              <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Continent</span>
              <input value={form.continent} onChange={(e) => set("continent", e.target.value)} className={inputCls} />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Referee</span>
              <input value={form.referee} onChange={(e) => set("referee", e.target.value)} className={inputCls} />
            </label>
          </div>
        </section>

        {/* Status & score */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Status, score & live</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <label className={labelCls}>
              <span className="text-slate-400">Status</span>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Home score</span>
              <input type="number" min={0} value={form.homeScore} onChange={(e) => set("homeScore", e.target.value)} className={inputCls} placeholder="—" />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Away score</span>
              <input type="number" min={0} value={form.awayScore} onChange={(e) => set("awayScore", e.target.value)} className={inputCls} placeholder="—" />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Minute (live)</span>
              <input type="number" min={0} max={130} value={form.minute} onChange={(e) => set("minute", e.target.value)} className={inputCls} placeholder="67" />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Period</span>
              <input value={form.period} onChange={(e) => set("period", e.target.value)} className={inputCls} placeholder="1H / 2H / ET" />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Attendance</span>
              <input type="number" value={form.attendance} onChange={(e) => set("attendance", e.target.value)} className={inputCls} />
            </label>
          </div>
        </section>

        {/* Events */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Events (goals, cards…)</h2>
            <button type="button" onClick={() => setEvents((e) => [...e, emptyEvent()])} className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300">
              + Add event
            </button>
          </div>
          {events.length === 0 && <p className="text-xs text-slate-500">No events yet.</p>}
          <div className="space-y-2">
            {events.map((ev, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
                <label className={labelCls}>
                  <span className="text-slate-500">Min</span>
                  <input value={ev.minute} onChange={(e) => setEvents((arr) => arr.map((x, j) => j === i ? { ...x, minute: e.target.value } : x))} className={inputCls} />
                </label>
                <label className={labelCls}>
                  <span className="text-slate-500">Type</span>
                  <select value={ev.type} onChange={(e) => setEvents((arr) => arr.map((x, j) => j === i ? { ...x, type: e.target.value } : x))} className={inputCls}>
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className={labelCls}>
                  <span className="text-slate-500">Team</span>
                  <select value={ev.team} onChange={(e) => setEvents((arr) => arr.map((x, j) => j === i ? { ...x, team: e.target.value as "home" | "away" } : x))} className={inputCls}>
                    <option value="home">Home</option>
                    <option value="away">Away</option>
                  </select>
                </label>
                <label className={`${labelCls} md:col-span-2`}>
                  <span className="text-slate-500">Player</span>
                  <input value={ev.player} onChange={(e) => setEvents((arr) => arr.map((x, j) => j === i ? { ...x, player: e.target.value } : x))} className={inputCls} />
                </label>
                <button type="button" onClick={() => setEvents((arr) => arr.filter((_, j) => j !== i))} className="text-xs text-red-300 py-2">Remove</button>
              </div>
            ))}
          </div>
        </section>

        {/* Lineups */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Lineups (one player per line)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className={labelCls}>
              <span className="text-slate-400">Home lineup</span>
              <textarea value={homeLineup} onChange={(e) => setHomeLineup(e.target.value)} rows={8} className={inputCls} placeholder={"1. Raya\n2. White\n..."} />
            </label>
            <label className={labelCls}>
              <span className="text-slate-400">Away lineup</span>
              <textarea value={awayLineup} onChange={(e) => setAwayLineup(e.target.value)} rows={8} className={inputCls} placeholder={"1. Sanchez\n2. Gusto\n..."} />
            </label>
          </div>
        </section>

        {/* Stats */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Team stats (JSON)</h2>
          <textarea value={statsText} onChange={(e) => setStatsText(e.target.value)} rows={8} className={`${inputCls} font-mono text-xs`} />
          <label className={labelCls}>
            <span className="text-slate-400">Notes</span>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={inputCls} />
          </label>
        </section>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={form.publishToFan} onChange={(e) => set("publishToFan", e.target.checked)} />
          Publish to fan app Scores (recommended)
        </label>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-100 font-semibold text-sm disabled:opacity-40"
        >
          {saving ? "Saving…" : "Create match → database"}
        </button>
      </form>
    </div>
  );
}

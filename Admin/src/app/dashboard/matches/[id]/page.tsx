"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MatchLiveEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [minute, setMinute] = useState("");
  const [period, setPeriod] = useState("");
  const [venue, setVenue] = useState("");
  const [eventMinute, setEventMinute] = useState("");
  const [eventType, setEventType] = useState("goal");
  const [eventPlayer, setEventPlayer] = useState("");
  const [eventTeam, setEventTeam] = useState<"home" | "away">("home");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/matches/${id}`, { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to load");
        return;
      }
      setMatch(data);
      setHomeScore(data.homeScore != null ? String(data.homeScore) : "");
      setAwayScore(data.awayScore != null ? String(data.awayScore) : "");
      setStatus(data.status || "upcoming");
      setMinute(data.minute != null ? String(data.minute) : "");
      setPeriod(data.period || "");
      setVenue(data.venue || "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Update failed");
        return;
      }
      setMsg("Updated — fan app will reflect scores/status");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const saveLive = () =>
    patch({
      homeScore: homeScore === "" ? null : Number(homeScore),
      awayScore: awayScore === "" ? null : Number(awayScore),
      status,
      minute: minute === "" ? null : Number(minute),
      period: period || null,
      venue: venue || null,
    });

  const addEvent = async () => {
    const events = Array.isArray(match?.events) ? [...match.events] : [];
    events.push({
      minute: eventMinute === "" ? 0 : Number(eventMinute),
      type: eventType,
      player: eventPlayer.trim(),
      team: eventTeam,
    });
    // auto bump score on goal
    let hs = homeScore === "" ? 0 : Number(homeScore);
    let as = awayScore === "" ? 0 : Number(awayScore);
    if (eventType === "goal" || eventType === "penalty") {
      if (eventTeam === "home") hs += 1;
      else as += 1;
    }
    if (eventType === "own_goal") {
      if (eventTeam === "home") as += 1;
      else hs += 1;
    }
    setHomeScore(String(hs));
    setAwayScore(String(as));
    await patch({
      events,
      homeScore: hs,
      awayScore: as,
      status: status === "upcoming" ? "live" : status,
      minute: eventMinute === "" ? minute : Number(eventMinute),
    });
    setEventPlayer("");
  };

  if (loading) return <p className="text-slate-400 text-sm">Loading match…</p>;
  if (!match) {
    return (
      <div className="space-y-2">
        <p className="text-red-300 text-sm">{err || "Not found"}</p>
        <button onClick={() => router.push("/dashboard/create-match")} className="text-sky-300 text-sm underline">
          Create match
        </button>
      </div>
    );
  }

  const events = Array.isArray(match.events) ? match.events : [];
  const inputCls = "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <button type="button" onClick={() => router.push("/dashboard/create-match")} className="text-xs text-slate-400 hover:text-white mb-2">
          ← Create another
        </button>
        <h1 className="text-2xl font-bold text-white">
          {match.homeTeamName} <span className="text-slate-500">vs</span> {match.awayTeamName}
        </h1>
        <p className="text-sm text-slate-400">
          {match.League?.name || "Match"} · {match.venue || "TBD"} ·{" "}
          {match.kickoffAt ? new Date(match.kickoffAt).toLocaleString() : ""}
        </p>
      </div>

      {msg && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{msg}</div>}
      {err && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
        <h2 className="text-sm font-bold text-amber-300 uppercase">Live scoreboard</h2>
        <div className="flex items-center justify-center gap-4 text-3xl font-black text-white">
          <input type="number" min={0} value={homeScore} onChange={(e) => setHomeScore(e.target.value)} className="w-20 text-center bg-slate-950 border border-slate-700 rounded-lg py-2" />
          <span className="text-slate-500">:</span>
          <input type="number" min={0} value={awayScore} onChange={(e) => setAwayScore(e.target.value)} className="w-20 text-center bg-slate-950 border border-slate-700 rounded-lg py-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="block text-xs space-y-1">
            <span className="text-slate-400">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {["upcoming", "live", "ht", "ft", "postponed", "cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400">Minute</span>
            <input value={minute} onChange={(e) => setMinute(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400">Period</span>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400">Venue</span>
            <input value={venue} onChange={(e) => setVenue(e.target.value)} className={inputCls} />
          </label>
        </div>
        <button type="button" disabled={saving} onClick={saveLive} className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-100 text-sm font-semibold disabled:opacity-40">
          {saving ? "Saving…" : "Update score & status"}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
        <h2 className="text-sm font-bold text-amber-300 uppercase">Add event</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <input placeholder="Min" value={eventMinute} onChange={(e) => setEventMinute(e.target.value)} className={inputCls} />
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputCls}>
            {["goal", "own_goal", "penalty", "yellow_card", "red_card", "substitution", "var"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select value={eventTeam} onChange={(e) => setEventTeam(e.target.value as "home" | "away")} className={inputCls}>
            <option value="home">Home</option>
            <option value="away">Away</option>
          </select>
          <input placeholder="Player" value={eventPlayer} onChange={(e) => setEventPlayer(e.target.value)} className={inputCls} />
          <button type="button" onClick={addEvent} disabled={saving || !eventPlayer.trim()} className="px-3 py-2 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-200 text-xs font-semibold disabled:opacity-40">
            Add
          </button>
        </div>
        <ul className="space-y-1 text-sm text-slate-300 max-h-48 overflow-y-auto">
          {events.length === 0 && <li className="text-slate-500 text-xs">No events</li>}
          {events.map((ev: any, i: number) => (
            <li key={i} className="flex gap-2 border-b border-slate-800 py-1">
              <span className="text-slate-500 w-10">{ev.minute}&apos;</span>
              <span className="text-amber-200">{ev.type}</span>
              <span>{ev.player}</span>
              <span className="text-slate-500">({ev.team})</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Post to Feed */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
        <h2 className="text-sm font-bold text-amber-300 uppercase">Publish to Fan Feed</h2>
        <p className="text-xs text-slate-400">Post this match to the fan home feed so fans can like, comment, predict and share.</p>
        {published ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Posted to feed! Fans can now interact with this match.
          </div>
        ) : (
          <button
            type="button"
            disabled={publishing}
            onClick={async () => {
              setPublishing(true);
              try {
                const res = await fetch(`/api/admin/matches/${id}`, {
                  method: 'POST',
                  credentials: 'include',
                });
                const data = await res.json();
                if (res.ok) {
                  setPublished(true);
                  setMsg('Match posted to fan feed!');
                } else {
                  setErr(data.error || 'Failed to publish');
                }
              } catch (e) {
                setErr(e instanceof Error ? e.message : 'Network error');
              } finally {
                setPublishing(false);
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 text-sm font-semibold disabled:opacity-40 flex items-center gap-2"
          >
            {publishing ? 'Publishing...' : 'Post to Feed'}
          </button>
        )}
      </section>
    </div>
  );
}

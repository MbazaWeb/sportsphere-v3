"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminFetch } from '@/lib/admin-api';

type Team = { id: string; name: string; logoUrl?: string | null; city?: string | null };

export default function LeagueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [league, setLeague] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<{ id: string; name: string }[]>([]);
  const [pick, setPick] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [liveLog, setLiveLog] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [l, t] = await Promise.all([
        adminFetch(`/api/admin/leagues/${id}`, { credentials: "include", cache: "no-store" }).then((r) => r.json()),
        adminFetch("/api/admin/teams?limit=300", { credentials: "include" }).then((r) => r.json()),
      ]);
      if (l.error) {
        setErr(l.error);
        setLeague(null);
      } else {
        setLeague(l);
      }
      setAllTeams((t.data || t.teams || []).map((x: any) => ({ id: x.id, name: x.name })));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Live league updates with automatic reconnection + room rejoin
  useEffect(() => {
    let socket: any;
    let cancelled = false;
    const room = `league_${id}`;

    const onLeague = (data: any) => {
      setLiveLog((x) => [
        `league_update: ${data?.action || "update"} @ ${new Date().toLocaleTimeString()}`,
        ...x,
      ].slice(0, 8));
      load();
    };
    const onFeed = (data: any) => {
      setLiveLog((x) => [
        `scores_feed: ${data?.type || "?"} @ ${new Date().toLocaleTimeString()}`,
        ...x,
      ].slice(0, 8));
    };
    const rejoin = () => {
      socket?.emit("join_room", room);
      setLiveLog((x) => [`WS (re)connected ${new Date().toLocaleTimeString()}`, ...x].slice(0, 8));
    };

    (async () => {
      try {
        const { getSharedSocket } = await import("@/lib/socket-client");
        socket = await getSharedSocket();
        if (cancelled) return;
        socket.on("league_update", onLeague);
        socket.on("scores_feed", onFeed);
        socket.on("connect", rejoin);
        if (socket.connected) rejoin();
        else socket.connect();
      } catch {
        setLiveLog((x) => [`WS unavailable`, ...x].slice(0, 8));
      }
    })();

    return () => {
      cancelled = true;
      try {
        socket?.off("league_update", onLeague);
        socket?.off("scores_feed", onFeed);
        socket?.off("connect", rejoin);
        socket?.emit("leave_room", room);
      } catch {}
    };
  }, [id, load]);

  const teams: Team[] = league?.teams || league?.Team || [];
  const memberIds = new Set(teams.map((t) => t.id));
  const available = allTeams.filter(
    (t) => !memberIds.has(t.id) && t.name.toLowerCase().includes(filter.toLowerCase())
  );

  const addTeams = async () => {
    if (!pick.length) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await adminFetch(`/api/admin/leagues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "add_teams", teamIds: pick }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed");
        return;
      }
      setMsg(`Added ${pick.length} team(s)`);
      setPick([]);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const removeTeam = async (teamId: string) => {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/leagues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "remove_team", teamId }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400 text-sm">Loading…</p>;
  if (!league) {
    return (
      <div>
        <p className="text-red-300 text-sm">{err || "Not found"}</p>
        <button onClick={() => router.push("/dashboard/create-competition")} className="text-sky-300 text-sm underline mt-2">
          Create competition
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/create-competition")}
          className="text-xs text-slate-400 hover:text-white"
        >
          ← Create another
        </button>
        <h1 className="text-2xl font-bold text-white mt-1">{league.name}</h1>
        <p className="text-sm text-slate-400">
          {league.type} · {league.season || "no season"} · {league.country || "—"} ·{" "}
          {teams.length} teams
        </p>
      </div>

      {msg && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{msg}</div>}
      {err && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-sm font-bold text-amber-300 uppercase mb-3">Teams in competition</h2>
        {teams.length === 0 ? (
          <p className="text-xs text-slate-500">No teams yet — add below.</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm text-white">
                <span>{t.name}</span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => removeTeam(t.id)}
                  className="text-xs text-red-300 hover:text-red-200"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-amber-300 uppercase">Add teams</h2>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search…"
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white w-40"
          />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {available.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm text-slate-200 px-1 py-1">
              <input
                type="checkbox"
                checked={pick.includes(t.id)}
                onChange={() =>
                  setPick((p) => (p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]))
                }
              />
              {t.name}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={saving || !pick.length}
          onClick={addTeams}
          className="px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-200 text-sm font-semibold disabled:opacity-40"
        >
          {saving ? "Saving…" : `Add ${pick.length || ""} team(s)`}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase mb-2">Live updates (WebSocket)</h2>
        {liveLog.length === 0 ? (
          <p className="text-[11px] text-slate-500">Waiting for events…</p>
        ) : (
          <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
            {liveLog.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

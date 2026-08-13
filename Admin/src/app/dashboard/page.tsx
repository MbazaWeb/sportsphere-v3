"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminSocket } from "@/lib/socket-client";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Activity,
  Users,
  FileText,
  Trophy,
  Heart,
  MessageCircle,
  UserPlus,
  Wifi,
  Cpu,
  Database,
  Image as ImageIcon,
  Video,
  BarChart3,
  Sparkles,
  Radio,
} from "lucide-react";

const COLORS = ["#f5c518", "#38bdf8", "#a78bfa", "#34d399", "#f472b6", "#fb923c", "#94a3b8"];

type SeriesPoint = {
  day: string;
  signups: number;
  posts: number;
  likes: number;
  comments: number;
  follows: number;
  images: number;
  videos: number;
  polls: number;
};

type Overview = {
  ok?: boolean;
  db: Record<string, number>;
  series: SeriesPoint[];
  postTypes: { name: string; value: number }[];
  sports: { name: string; teams: number; players: number; icon?: string }[];
  flow: {
    nodes: { id: string; label: string; value: number }[];
    edges: { from: string; to: string }[];
  };
  system: {
    cpu: number;
    ram: number;
    eth0: { rx: number; tx: number };
  };
  timestamp: string;
};

function Kpi({
  label,
  value,
  icon: Icon,
  color,
  pulse,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  pulse?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className={`mt-1 text-2xl font-extrabold tabular-nums ${color}`}>{value}</p>
        </div>
        <div className={`rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {pulse && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-current opacity-40"
          style={{ color: "currentColor", width: "100%" }}
          animate={{ opacity: [0.2, 0.8, 0.2], scaleX: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-4 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live
        </span>
      </div>
      <div className="h-56 w-full">{children}</div>
    </motion.div>
  );
}

/** Animated node-edge flow of app usage */
function LiveFlowChart({
  nodes,
}: {
  nodes: { id: string; label: string; value: number }[];
}) {
  const max = Math.max(1, ...nodes.map((n) => n.value));
  return (
    <div className="relative h-56 overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800/80">
      {/* flowing particles */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(245,197,24,0.8)]"
          initial={{ left: "5%", top: `${15 + i * 12}%`, opacity: 0 }}
          animate={{
            left: ["5%", "30%", "55%", "80%", "95%"],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: i * 0.4, ease: "linear" }}
        />
      ))}
      <div className="relative z-10 flex h-full items-center justify-between gap-2 px-3">
        {nodes.map((n, idx) => {
          const h = 28 + (n.value / max) * 72;
          return (
            <div key={n.id} className="flex flex-1 flex-col items-center gap-2">
              <motion.div
                className="flex w-full max-w-[72px] flex-col items-center justify-end rounded-lg border border-amber-400/20 bg-gradient-to-t from-amber-500/20 to-sky-500/10"
                style={{ height: `${h}%`, minHeight: 40 }}
                animate={{ boxShadow: ["0 0 0 rgba(245,197,24,0)", "0 0 18px rgba(245,197,24,0.35)", "0 0 0 rgba(245,197,24,0)"] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: idx * 0.15 }}
              >
                <span className="pb-1 text-sm font-black text-amber-300 tabular-nums">{n.value}</span>
              </motion.div>
              <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {n.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnimatedOverviewDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [sysHistory, setSysHistory] = useState<
    { time: string; cpu: number; ram: number; rx: number; tx: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview-stats", { cache: "no-store", credentials: "include" });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to load stats");
        return;
      }
      setError(null);
      setData(result);
      const now = new Date().toLocaleTimeString([], {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setSysHistory((prev) => [
        ...prev.slice(-24),
        {
          time: now,
          cpu: result.system?.cpu ?? 0,
          ram: result.system?.ram ?? 0,
          rx: result.system?.eth0?.rx ?? 0,
          tx: result.system?.eth0?.tx ?? 0,
        },
      ]);
      setTick((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    let s: ReturnType<typeof getAdminSocket> | null = null;
    try {
      s = getAdminSocket();
      const onPresence = (payload: { onlineCount?: number }) => {
        if (typeof payload?.onlineCount === "number") {
          setData((prev) =>
            prev
              ? { ...prev, db: { ...prev.db, onlineUsers: payload.onlineCount as number } }
              : prev
          );
        }
      };
      const onActivity = () => {
        load();
      };
      s.on("presence_update", onPresence);
      s.on("admin_activity", onActivity);
      s.on("feed_update", onActivity);
      return () => {
        s?.off("presence_update", onPresence);
        s?.off("admin_activity", onActivity);
        s?.off("feed_update", onActivity);
      };
    } catch {
      return;
    }
  }, [load]);

  const series = data?.series || [];
  const db = data?.db || {};
  const sportsRadar = useMemo(
    () =>
      (data?.sports || []).slice(0, 8).map((s) => ({
        sport: s.name.length > 10 ? s.name.slice(0, 10) + "…" : s.name,
        teams: s.teams,
        players: s.players,
      })),
    [data?.sports]
  );

  const contentPie = useMemo(() => {
    const rows = [
      { name: "Images", value: db.imagePosts || 0 },
      { name: "Videos", value: db.videoPosts || 0 },
      { name: "Polls", value: db.pollPosts || 0 },
      ...(data?.postTypes || []).filter(
        (p) => !["photo", "image", "video", "poll", "highlight"].includes((p.name || "").toLowerCase())
      ),
    ].filter((r) => r.value > 0);
    if (rows.length === 0) return [{ name: "Posts", value: db.posts || 1 }];
    return rows;
  }, [data, db]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-400" />
            Live Control Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            App flow, usage, engagement & sports — auto-refresh every 8s
            {data?.timestamp && (
              <span className="ml-2 text-slate-600">
                · tick #{tick} · {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:border-amber-400/40"
        >
          Refresh now
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <Kpi label="Online now" value={db.onlineUsers ?? "—"} icon={Radio} color="text-emerald-400" pulse />
        <Kpi label="Active 24h" value={db.activeUsers24h ?? "—"} icon={Wifi} color="text-sky-400" pulse />
        <Kpi label="Users" value={db.users ?? "—"} icon={Users} color="text-violet-300" />
        <Kpi label="Sign-ups today" value={db.signupsToday ?? "—"} icon={UserPlus} color="text-amber-300" pulse />
        <Kpi label="Posts" value={db.posts ?? "—"} icon={FileText} color="text-slate-100" />
        <Kpi label="Likes" value={db.likes ?? "—"} icon={Heart} color="text-pink-400" />
        <Kpi label="Comments" value={db.comments ?? "—"} icon={MessageCircle} color="text-cyan-300" />
        <Kpi label="Follows" value={db.follows ?? "—"} icon={Activity} color="text-orange-300" />
      </div>

      {/* Live app flow */}
      <ChartCard title="Live app flow" subtitle="Sign-ins → online → posts → engagement">
        <LiveFlowChart nodes={data?.flow?.nodes || []} />
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="New sign-ins" subtitle="Registrations · last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="gSign" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5c518" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f5c518" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Area type="monotone" dataKey="signups" stroke="#f5c518" fill="url(#gSign)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Active usage pulse" subtitle="Host CPU / RAM / network">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sysHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 9 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Legend />
              <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#f5c518" dot={false} strokeWidth={2} isAnimationActive />
              <Line type="monotone" dataKey="ram" name="RAM %" stroke="#38bdf8" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="rx" name="RX KB/s" stroke="#34d399" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="tx" name="TX KB/s" stroke="#a78bfa" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Posts over time" subtitle="Daily posts · 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Bar dataKey="posts" fill="#38bdf8" radius={[4, 4, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Likes & comments" subtitle="Engagement velocity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="gLike" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Legend />
              <Area type="monotone" dataKey="likes" stroke="#f472b6" fill="url(#gLike)" strokeWidth={2} />
              <Area type="monotone" dataKey="comments" stroke="#22d3ee" fill="url(#gCom)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Follow graph" subtitle="New follow edges per day">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="follows" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Media posts" subtitle="Images · videos · polls">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Legend />
              <Bar dataKey="images" stackId="m" fill="#a78bfa" radius={[0, 0, 0, 0]} />
              <Bar dataKey="videos" stackId="m" fill="#f472b6" />
              <Bar dataKey="polls" stackId="m" fill="#f5c518" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Content mix" subtitle="Post types & media">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={contentPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={78}
                paddingAngle={3}
                isAnimationActive
              >
                {contentPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sports graph" subtitle="Teams & players by sport" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={sportsRadar}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="sport" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: "#64748b", fontSize: 9 }} />
              <Radar name="Teams" dataKey="teams" stroke="#f5c518" fill="#f5c518" fillOpacity={0.25} />
              <Radar name="Players" dataKey="players" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
              <Legend />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Kpi label="Teams" value={db.teams ?? "—"} icon={Trophy} color="text-emerald-300" />
        <Kpi label="Players" value={db.players ?? "—"} icon={Users} color="text-sky-300" />
        <Kpi label="Sports" value={db.sports ?? "—"} icon={Trophy} color="text-amber-300" />
        <Kpi label="Polls" value={db.polls ?? "—"} icon={BarChart3} color="text-violet-300" />
        <Kpi label="Image posts" value={db.imagePosts ?? "—"} icon={ImageIcon} color="text-fuchsia-300" />
        <Kpi label="Video posts" value={db.videoPosts ?? "—"} icon={Video} color="text-rose-300" />
      </div>

      {/* Host gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "CPU", val: data?.system?.cpu ?? 0, icon: Cpu, color: "text-amber-400" },
          { label: "RAM", val: data?.system?.ram ?? 0, icon: Database, color: "text-sky-400" },
          {
            label: "Net RX+TX KB/s",
            val: (data?.system?.eth0?.rx ?? 0) + (data?.system?.eth0?.tx ?? 0),
            icon: Activity,
            color: "text-emerald-400",
          },
        ].map((g) => (
          <div key={g.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>{g.label}</span>
              <g.icon className={`h-4 w-4 ${g.color}`} />
            </div>
            <p className={`mt-2 text-3xl font-black tabular-nums ${g.color}`}>
              {typeof g.val === "number" ? g.val.toFixed(1) : g.val}
              {g.label !== "Net RX+TX KB/s" ? "%" : ""}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-sky-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Number(g.val) || 0)}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";
import React from "react";

export interface MetricProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon?: string;
}

export function MetricCard({ title, value, change, isPositive = true, subtitle, icon }: MetricProps) {
  return (
    <div className="p-5 rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#121824] to-[#0f141c] hover:border-slate-700/80 transition-all shadow-sm space-y-3">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        {change && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPositive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
            {isPositive ? "↑" : "↓"} {change}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>}
    </div>
  );
}

export function MiniSparkline({ points, color = "#f59e0b" }: { points: number[]; color?: string }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const width = 120;
  const height = 32;
  
  const pathData = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / (max - min || 1)) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={pathData} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

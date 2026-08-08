"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "📊 Overview", exact: true },
  { href: "/admin/users", label: "👥 Users Manager" },
  { href: "/admin/sports", label: "🏆 Sports Manager" },
  { href: "/admin/roles", label: "🛡️ Role Approvals" },
  { href: "/admin/posts", label: "📝 Content Moderation" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#0f141c] p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-2xl">⚽</span>
            <h1 className="text-xl font-bold tracking-wide text-amber-400">SportSphere Admin</h1>
          </div>
          <nav className="space-y-1">
            {NAV.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                      : "hover:bg-slate-800/80 hover:text-amber-400"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to SportSphere App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}

import Link from "next/link";
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
            <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800/80 hover:text-amber-400 transition-colors">
              📊 Overview
            </Link>
            <Link href="/admin/users" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800/80 hover:text-amber-400 transition-colors">
              👥 Users Manager
            </Link>
            <Link href="/admin/sports" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800/80 hover:text-amber-400 transition-colors">
              🏆 Sports Manager
            </Link>
            <Link href="/admin/roles" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800/80 hover:text-amber-400 transition-colors">
              🛡️ Role Approvals
            </Link>
            <Link href="/admin/posts" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800/80 hover:text-amber-400 transition-colors">
              📝 Content Moderation
            </Link>
          </nav>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <Link href="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
            ← Back to SportSphere App
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

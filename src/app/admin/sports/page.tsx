"use client";
import React, { useEffect, useState } from "react";

interface SportItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminSportsPage() {
  const [sports, setSports] = useState<SportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  const fetchSports = () => {
    setLoading(true);
    fetch("/api/sports")
      .then((res) => res.json())
      .then((data) => {
        setSports(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load sports:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSports();
  }, []);

  const handleAddSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const res = await fetch("/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, icon, isActive: true, displayOrder: sports.length + 1 }),
      });

      if (res.ok) {
        setName("");
        setIcon("");
        fetchSports();
      }
    } catch (err) {
      console.error("Failed to add sport:", err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Sports Manager</h1>
        <p className="text-sm text-slate-400 mt-1">Configure and manage supported sports and visual tags.</p>
      </div>

      {/* Add Sport Form */}
      <form onSubmit={handleAddSport} className="mb-8 p-6 rounded-xl border border-slate-800 bg-[#0f141c]">
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">Add New Sport</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Sport Name (e.g., Basketball)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-[#141b26] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
            required
          />
          <input
            type="text"
            placeholder="Icon Emoji (e.g., 🏀)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full sm:w-36 bg-[#141b26] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="bg-amber-400 text-slate-950 font-semibold px-6 py-2 rounded-lg text-sm hover:bg-amber-300 transition-colors"
          >
            Add Sport
          </button>
        </div>
      </form>

      {/* Sports Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#141b26] text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Icon</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Loading sports...
                  </td>
                </tr>
              ) : sports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No sports found.
                  </td>
                </tr>
              ) : (
                sports.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xl">{s.icon || "⚽"}</td>
                    <td className="px-6 py-4 font-semibold text-white">{s.name}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">{s.slug}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

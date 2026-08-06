"use client";
import React, { useEffect, useState } from "react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned?: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (roleFilter !== "ALL") params.set("role", roleFilter);

    fetch(`/api/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const toggleBan = async (id: string, currentBannedStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !currentBannedStatus }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error("Failed to update user ban state:", err);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Users Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Search, update, or suspend platform user accounts.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            className="flex-1 bg-[#0f141c] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={fetchUsers}
            className="bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-amber-300 transition-colors"
          >
            Search
          </button>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-[#0f141c] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
        >
          <option value="ALL">All Roles</option>
          <option value="FAN">FAN</option>
          <option value="PRO">PRO</option>
          <option value="ADMINISTRATOR">ADMINISTRATOR</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#141b26] text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      <div>{u.name || "User"}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => toggleBan(u.id, !!u.isBanned)}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors ${
                          u.isBanned
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                        }`}
                      >
                        {u.isBanned ? "Unban" : "Ban"}
                      </button>
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

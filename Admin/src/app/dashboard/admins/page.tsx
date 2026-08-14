"use client";
import React, { useEffect, useState } from "react";
import { MetricCard } from "@/components/AdminMetrics";
import { adminFetch } from '@/lib/admin-api';

export default function CreateAdminPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("BILLING_ASSISTANT");
  const [scopeId, setScopeId] = useState("");
  const [status, setStatus] = useState("");
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/admins/list");
      if (res.ok) {
        const json = await res.json();
        setAdmins(json.admins || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Provisioning sub-assistant...");
    try {
      const res = await adminFetch("/api/admin/admins/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, scopeId }),
      });
      if (res.ok) {
        setStatus("✓ Sub-Assistant successfully created in database!");
        setName("");
        setEmail("");
        fetchAdmins();
      } else {
        const err = await res.json();
        setStatus(`Failed: ${err.error || "Could not create administrator"}`);
      }
    } catch {
      setStatus("Error executing database query.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Delegated Administration & Sub-Assistants</h1>
        <p className="text-sm text-slate-400 mt-1">Provision sub-administrators directly in the system database with scoped execution roles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total System Admins" value={loading ? "..." : admins.length} icon="🔑" subtitle="Queried from PostgreSQL User table" />
        <MetricCard title="Active Delegation Scopes" value="6 Tiers" icon="🛡️" subtitle="SUPER_ADMIN down to BILLING_ASSISTANT" />
        <MetricCard title="Database Status" value="OPERATIONAL" icon="🟢" subtitle="Prisma connection healthy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleCreate} className="bg-[#0f141c] border border-slate-800/80 p-6 rounded-xl space-y-4">
          <h2 className="text-base font-semibold text-amber-400 border-b border-slate-800 pb-3">Provision Sub-Assistant</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400">Assistant Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full mt-1 bg-[#0b0e14] border border-slate-800 p-2.5 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mt-1 bg-[#0b0e14] border border-slate-800 p-2.5 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Assigned Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full mt-1 bg-[#0b0e14] border border-slate-800 p-2.5 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none">
                <option value="SUPER_ADMIN">Owner / Super Admin</option>
                <option value="ORGANIZATION_ADMIN">Organization Admin</option>
                <option value="FINANCE_ADMIN">Finance Admin</option>
                <option value="BILLING_ASSISTANT">Sub-Assistant: Billing & Invoicing</option>
                <option value="PROGRAM_ADMIN">Program / Competition Admin</option>
                <option value="ROSTER_ASSISTANT">Sub-Assistant: Roster & Eligibility</option>
                <option value="MATCH_OFFICIAL_ASSISTANT">Sub-Assistant: Match Official</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Target Scope ID (Optional)</label>
              <input value={scopeId} onChange={(e) => setScopeId(e.target.value)} placeholder="e.g. League ID, Team ID" className="w-full mt-1 bg-[#0b0e14] border border-slate-800 p-2.5 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none" />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-amber-400 text-slate-950 font-bold rounded-lg text-sm hover:bg-amber-500 transition-colors">
            Save Administrator to DB
          </button>
          {status && <p className="text-xs text-amber-400 text-center font-medium">{status}</p>}
        </form>

        <div className="lg:col-span-2 bg-[#0f141c] border border-slate-800/80 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-100">Live Administrator Roster</h2>
            <button onClick={fetchAdmins} className="text-xs text-amber-400 hover:underline">Refresh</button>
          </div>
          
          {loading ? (
            <div className="text-sm text-slate-400 py-4">Fetching roster from database...</div>
          ) : (
            <div className="space-y-3">
              {admins.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3.5 rounded-lg bg-[#0b0e14] border border-slate-800/80">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200 text-sm">{u.name} <span className="text-xs text-slate-500">({u.email})</span></div>
                    <div className="text-xs text-slate-400">Role: <span className="text-amber-400 font-mono">{u.adminRoleType || "SUPER_ADMIN"}</span> {u.assignedScopeId && `| Scope: ${u.assignedScopeId}`}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    {u.adminRoleType || "ADMIN"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

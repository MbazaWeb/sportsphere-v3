"use client";
import { apiFetch } from '@/lib/api';
import React, { useEffect, useState, useCallback } from 'react';

const ALL_PERMISSIONS = [
  { key: 'users', label: 'Users Manager', desc: 'Search, ban, and change user roles' },
  { key: 'posts', label: 'Content Moderation', desc: 'Delete posts and review reports' },
  { key: 'sports', label: 'Sports Manager', desc: 'Add/edit sports categories' },
  { key: 'roles', label: 'Role Approvals', desc: 'Approve/reject PRO role requests' },
  { key: 'verification', label: 'Event Verification', desc: 'Review and verify events' },
  { key: 'performance', label: 'Performance KPIs', desc: 'Configure KPI weights and metrics' },
  { key: 'admins', label: 'Admin Management', desc: 'Create admins and assign permissions (super-admin)' },
  { key: 'settings', label: 'Platform Settings', desc: 'Configure platform-wide settings' },
];

interface AdminUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: string;
  avatarUrl: string | null;
  isBanned: boolean;
  adminPermissions: string[];
  isSuperAdmin: boolean;
  registeredAt: string;
  lastSeenAt: string;
}

export default function AdminManagersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const togglePermission = (key: string) => {
    setNewPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleCreate = async () => {
    if (!newName || !newEmail || !newPassword) {
      showToast('Name, email, and password are required', false);
      return;
    }
    setProcessing(true);
    try {
      const res = await apiFetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName, email: newEmail, password: newPassword,
          permissions: newPermissions, makeAdmin: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Admin created successfully', true);
        setNewName(''); setNewEmail(''); setNewPassword(''); setNewPermissions([]);
        setShowCreate(false);
        loadAdmins();
      } else {
        showToast(data.error || 'Failed to create admin', false);
      }
    } catch {
      showToast('Network error', false);
    } finally { setProcessing(false); }
  };

  const handleUpdatePermissions = async (userId: string, permissions: string[]) => {
    setProcessing(true);
    try {
      const res = await apiFetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, permissions, makeAdmin: true }),
      });
      if (res.ok) {
        showToast('Permissions updated', true);
        setEditingId(null);
        loadAdmins();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update', false);
      }
    } catch {
      showToast('Network error', false);
    } finally { setProcessing(false); }
  };

  const handleRemoveAdmin = async (userId: string, name: string) => {
    if (!confirm(`Remove admin privileges from ${name}? They will become a regular fan.`)) return;
    setProcessing(true);
    try {
      const res = await apiFetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, makeAdmin: false }),
      });
      if (res.ok) {
        showToast('Admin removed', true);
        loadAdmins();
      }
    } catch {
      showToast('Network error', false);
    } finally { setProcessing(false); }
  };

  const handlePromoteUser = async () => {
    const email = prompt('Enter the email of the user to promote to admin:');
    if (!email) return;
    setProcessing(true);
    try {
      const res = await apiFetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: email, makeAdmin: true, permissions: ['users', 'posts'] }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('User promoted to admin', true);
        loadAdmins();
      } else {
        showToast(data.error || 'Failed to promote user. Make sure the user exists.', false);
      }
    } catch {
      showToast('Network error', false);
    } finally { setProcessing(false); }
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-semibold shadow-xl border ${
          toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Admin Managers</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, manage, and assign permissions to admin accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePromoteUser}
            className="px-4 py-2 rounded-lg border border-amber-400/30 text-amber-400 text-sm font-semibold hover:bg-amber-400/10 transition-colors"
          >
            Promote Existing User
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 text-sm font-semibold hover:bg-amber-300 transition-colors"
          >
            {showCreate ? 'Cancel' : '+ Create Admin'}
          </button>
        </div>
      </div>

      {/* Create Admin Form */}
      {showCreate && (
        <div className="mb-6 rounded-xl border border-amber-400/20 bg-[#141b26] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Admin Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
              <input
                type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#0f141c] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email *</label>
              <input
                type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-[#0f141c] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                placeholder="admin@sportsphere.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Password *</label>
              <input
                type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#0f141c] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                placeholder="Min 8 characters"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-2">Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {ALL_PERMISSIONS.map(p => (
                <button
                  key={p.key}
                  onClick={() => togglePermission(p.key)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    newPermissions.includes(p.key)
                      ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                      : 'bg-[#0f141c] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-semibold">{p.label}</div>
                  <div className="text-[11px] mt-0.5 opacity-70">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={processing || !newName || !newEmail || !newPassword}
            className="px-6 py-2.5 rounded-lg bg-amber-400 text-slate-950 text-sm font-bold hover:bg-amber-300 disabled:opacity-50 transition-colors"
          >
            {processing ? 'Creating...' : 'Create Admin Account'}
          </button>
        </div>
      )}

      {/* Admin List */}
      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-8 text-center text-slate-400">
          Loading admins...
        </div>
      ) : admins.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-12 text-center">
          <div className="text-4xl mb-3">👑</div>
          <p className="text-slate-300 font-semibold">No admins found</p>
          <p className="text-sm text-slate-500 mt-1">Create your first admin account above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {admins.map(admin => (
            <div key={admin.id} className="rounded-xl border border-slate-800 bg-[#0f141c] p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{admin.name}</span>
                    {admin.isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-[10px] font-bold text-amber-400">SUPER ADMIN</span>
                    )}
                    {admin.isBanned && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-bold text-red-400">BANNED</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{admin.email} · @{admin.handle}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Registered: {new Date(admin.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingId === admin.id ? (
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingId(admin.id)}
                      className="px-3 py-1.5 rounded-lg border border-amber-400/30 text-amber-400 text-xs font-semibold hover:bg-amber-400/10 transition-colors"
                    >
                      Edit Permissions
                    </button>
                  )}
                  {!admin.isSuperAdmin && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.id, admin.name)}
                      disabled={processing}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Permissions editor */}
              {editingId === admin.id && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <label className="block text-xs text-slate-400 mb-2">Permissions for {admin.name}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                    {ALL_PERMISSIONS.map(p => {
                      const hasPerm = admin.adminPermissions.includes(p.key);
                      return (
                        <button
                          key={p.key}
                          onClick={() => {
                            const updated = hasPerm
                              ? admin.adminPermissions.filter(x => x !== p.key)
                              : [...admin.adminPermissions, p.key];
                            // Update local state optimistically
                            setAdmins(prev => prev.map(a =>
                              a.id === admin.id ? { ...a, adminPermissions: updated } : a
                            ));
                          }}
                          className={`text-left p-3 rounded-lg border transition-colors ${
                            hasPerm
                              ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                              : 'bg-[#0f141c] border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-sm font-semibold">{p.label}</div>
                          <div className="text-[11px] mt-0.5 opacity-70">{p.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handleUpdatePermissions(admin.id, admin.adminPermissions)}
                    disabled={processing}
                    className="px-6 py-2 rounded-lg bg-amber-400 text-slate-950 text-sm font-bold hover:bg-amber-300 disabled:opacity-50 transition-colors"
                  >
                    {processing ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              )}

              {/* Permission badges (when not editing) */}
              {editingId !== admin.id && admin.adminPermissions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {admin.adminPermissions.map(perm => {
                    const permInfo = ALL_PERMISSIONS.find(p => p.key === perm);
                    return (
                      <span
                        key={perm}
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300"
                      >
                        {permInfo?.label || perm}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────
interface AdminRole {
  id: string;
  slug: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  module: string;
  description: string | null;
  permissions: any;
  scopeLevel: string;
}

interface SearchedUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: string;
  isVerified: boolean;
}

interface Assigner {
  id: string;
  name: string;
  email: string;
  handle: string;
}

interface UserAdminRoleGrant {
  id: string;
  userId: string;
  adminRoleSlug: string;
  assignedById: string | null;
  assignedBy: Assigner | null;
  assignedAt: string;
  revokedAt: string | null;
  isActive: boolean;
  regionCode: string | null;
  languageCode: string | null;
  notes: string | null;
  adminRole: AdminRole;
}

interface DelegationLog {
  id: string;
  actorId: string;
  actor: { id: string; name: string; email: string; handle: string } | null;
  targetUserId: string;
  targetUser: { id: string; name: string; email: string; handle: string } | null;
  action: 'grant' | 'revoke' | 'escalate' | 'demote';
  adminRoleSlug: string;
  adminRole: { slug: string; name: string; tier: number; module: string } | null;
  reason: string | null;
  regionCode: string | null;
  languageCode: string | null;
  createdAt: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function tierBadge(tier: number): { label: string; cls: string } {
  switch (tier) {
    case 1:
      return { label: 'T1 · SUPER', cls: 'bg-red-500/15 text-red-300 border-red-500/30' };
    case 2:
      return { label: 'T2 · DIRECTOR', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    case 3:
      return { label: 'T3 · SPECIALIST', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
    case 4:
      return { label: 'T4 · MODERATOR', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
    default:
      return { label: `T${tier}`, cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
  }
}

function moduleColor(mod: string): string {
  const map: Record<string, string> = {
    users: 'text-sky-300',
    trust_safety: 'text-orange-300',
    sports_content: 'text-emerald-300',
    community: 'text-violet-300',
    platform: 'text-amber-300',
    cross: 'text-red-300',
  };
  return map[mod] || 'text-slate-300';
}

function actionColor(action: string): string {
  if (action === 'grant') return 'text-emerald-300';
  if (action === 'revoke') return 'text-red-300';
  if (action === 'escalate') return 'text-amber-300';
  if (action === 'demote') return 'text-slate-300';
  return 'text-slate-300';
}

// ─── Determine which roles the actor can grant ───────────────────────
// Mirrors the server-side logic in /api/admin/delegation/grant/route.ts.
function canGrantRole(actorRole: string, role: AdminRole): boolean {
  const r = (actorRole || '').toUpperCase();
  if (r === 'SUPER_ADMIN' || r === 'ADMINISTRATOR') return true;
  // Directors can only grant Tier 3 or 4 roles within their own module.
  if (r.startsWith('DIR_')) {
    if (role.tier !== 3 && role.tier !== 4) return false;
    // DIR_USER_OPS → module 'users', DIR_TRUST_SAFETY → 'trust_safety', etc.
    // The director's module is encoded in their slug — derive it.
    const moduleMap: Record<string, string> = {
      DIR_USER_OPS: 'users',
      DIR_TRUST_SAFETY: 'trust_safety',
      DIR_SPORTS_CONTENT: 'sports_content',
      DIR_COMMUNITY: 'community',
      DIR_PLATFORM: 'platform',
    };
    const myModule = moduleMap[r];
    if (!myModule) return false;
    return role.module === myModule;
  }
  // Tier 3 / Tier 4 admins cannot delegate (no 'delegate' permission).
  return false;
}

// ─── Page ────────────────────────────────────────────────────────────
export default function DelegationPage() {
  // Admin profile (for permission-aware UI)
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  // Catalog of all admin roles (for the role picker)
  const [allRoles, setAllRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // Grant form state
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<SearchedUser[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [selectedRoleSlug, setSelectedRoleSlug] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [languageCode, setLanguageCode] = useState('');
  const [notes, setNotes] = useState('');
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  // Recent delegation logs (auto-refreshing)
  const [logs, setLogs] = useState<DelegationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Active admin roles lookup (by user)
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<SearchedUser[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupSelected, setLookupSelected] = useState<SearchedUser | null>(null);
  const [userGrants, setUserGrants] = useState<UserAdminRoleGrant[]>([]);
  const [userGrantsLoading, setUserGrantsLoading] = useState(false);

  // Revoke modal
  const [revokeTarget, setRevokeTarget] = useState<UserAdminRoleGrant | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  // Toast (inline)
  const [toast, setToast] = useState<{ kind: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (kind: 'success' | 'error' | 'info', msg: string) => {
    setToast({ kind, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  // ─── Load admin profile + role catalog on mount ─────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, rolesRes] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch('/api/admin/delegation/roles', { cache: 'no-store' }),
        ]);
        if (cancelled) return;
        if (meRes.ok) {
          const meJson = await meRes.json();
          if (meJson?.user) setAdmin(meJson.user);
        }
        if (rolesRes.ok) {
          const rj = await rolesRes.json();
          setAllRoles(rj?.data || []);
        }
      } catch (err) {
        console.error('init error:', err);
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Filter roles by what THIS admin can grant ──────────────
  const grantableRoles = useMemo(() => {
    if (!admin) return [] as AdminRole[];
    return allRoles.filter((r) => canGrantRole(admin.role, r));
  }, [admin, allRoles]);

  // Group grantable roles by tier for the dropdown
  const rolesByTier = useMemo(() => {
    const groups: Record<number, AdminRole[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const r of grantableRoles) {
      groups[r.tier]?.push(r);
    }
    return groups;
  }, [grantableRoles]);

  // Selected role object (for showing region/language inputs)
  const selectedRole = useMemo(
    () => allRoles.find((r) => r.slug === selectedRoleSlug) || null,
    [allRoles, selectedRoleSlug]
  );

  // ─── Debounced user search ─────────────────────────────────
  useEffect(() => {
    if (userQuery.trim().length < 2) {
      setUserResults([]);
      setUserSearchLoading(false);
      return;
    }
    setUserSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/delegation/search-users?q=${encodeURIComponent(userQuery.trim())}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const json = await res.json();
          setUserResults(json?.data || []);
        }
      } catch (err) {
        console.error('user search error:', err);
      } finally {
        setUserSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [userQuery]);

  // ─── Load delegation logs (with auto-refresh every 30s) ────
  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/admin/delegation/logs?limit=20', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setLogs(json?.data || []);
      }
    } catch (err) {
      console.error('logs load error:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadLogs();
    const id = setInterval(loadLogs, 30000);
    return () => clearInterval(id);
  }, [loadLogs]);

  // ─── Lookup user search (separate box) ─────────────────────
  useEffect(() => {
    if (lookupQuery.trim().length < 2) {
      setLookupResults([]);
      setLookupLoading(false);
      return;
    }
    setLookupLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/delegation/search-users?q=${encodeURIComponent(lookupQuery.trim())}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const json = await res.json();
          setLookupResults(json?.data || []);
        }
      } catch (err) {
        console.error('lookup search error:', err);
      } finally {
        setLookupLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [lookupQuery]);

  // ─── Load grants for the selected lookup user ──────────────
  const loadUserGrants = useCallback(async () => {
    if (!lookupSelected) {
      setUserGrants([]);
      return;
    }
    setUserGrantsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/delegation/user-roles?userId=${encodeURIComponent(lookupSelected.id)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const json = await res.json();
        setUserGrants(json?.data || []);
      }
    } catch (err) {
      console.error('user grants load error:', err);
    } finally {
      setUserGrantsLoading(false);
    }
  }, [lookupSelected]);

  useEffect(() => {
    loadUserGrants();
  }, [loadUserGrants]);

  // ─── Stats derived from logs (rough but accurate enough) ───
  const stats = useMemo(() => {
    const granted = logs.filter((l) => l.action === 'grant');
    const revoked = logs.filter((l) => l.action === 'revoke');
    const uniqueAdmins = new Set(granted.map((l) => l.targetUserId)).size;
    const directorsGranted = granted.filter((l) =>
      l.adminRoleSlug.startsWith('DIR_')
    ).length;
    return {
      totalAdmins: uniqueAdmins,
      activeRolesGranted: Math.max(0, granted.length - revoked.length),
      pendingRevocations: revoked.length,
      directors: directorsGranted,
    };
  }, [logs]);

  // ─── Grant handler ─────────────────────────────────────────
  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setGrantError(null);
    setGrantSuccess(null);
    if (!selectedUser) {
      setGrantError('Please select a user to grant the role to.');
      return;
    }
    if (!selectedRoleSlug) {
      setGrantError('Please select an admin role to grant.');
      return;
    }
    setGranting(true);
    try {
      const res = await fetch('/api/admin/delegation/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          adminRoleSlug: selectedRoleSlug,
          regionCode: regionCode.trim() || null,
          languageCode: languageCode.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGrantError(json?.error || `Request failed (HTTP ${res.status})`);
        showToast('error', json?.error || 'Grant failed');
        return;
      }
      setGrantSuccess(`Granted ${selectedRoleSlug} to ${selectedUser.name || selectedUser.handle}.`);
      showToast('success', `Granted ${selectedRoleSlug} to ${selectedUser.name || selectedUser.handle}`);
      // Reset form (keep selected user for chained grants? No, clear it.)
      setSelectedRoleSlug('');
      setRegionCode('');
      setLanguageCode('');
      setNotes('');
      // Refresh logs
      loadLogs();
      // If the granted user is currently selected in the lookup box, refresh their grants too.
      if (lookupSelected && lookupSelected.id === selectedUser.id) {
        loadUserGrants();
      }
    } catch (err) {
      console.error('grant error:', err);
      setGrantError('Network error.');
      showToast('error', 'Network error');
    } finally {
      setGranting(false);
    }
  }

  // ─── Revoke handler ────────────────────────────────────────
  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await fetch('/api/admin/delegation/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAdminRoleId: revokeTarget.id,
          reason: revokeReason.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast('error', json?.error || `Revoke failed (HTTP ${res.status})`);
        return;
      }
      showToast('success', `Revoked ${revokeTarget.adminRoleSlug} from ${revokeTarget.userId === admin?.id ? 'yourself' : 'user'}`);
      setRevokeTarget(null);
      setRevokeReason('');
      loadUserGrants();
      loadLogs();
    } catch (err) {
      console.error('revoke error:', err);
      showToast('error', 'Network error');
    } finally {
      setRevoking(false);
    }
  }

  const actorIsDirector =
    !!admin && (admin.role || '').toUpperCase().startsWith('DIR_');
  const actorIsSuperAdmin =
    !!admin &&
    ['SUPER_ADMIN', 'ADMINISTRATOR'].includes((admin.role || '').toUpperCase());

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg text-sm max-w-sm ${
            toast.kind === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
              : toast.kind === 'error'
                ? 'bg-red-500/10 border-red-500/40 text-red-200'
                : 'bg-sky-500/10 border-sky-500/40 text-sky-200'
          }`}
        >
          {toast.msg}
          <button
            onClick={() => setToast(null)}
            className="ml-3 text-slate-400 hover:text-white"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">🔐 Role Delegation</h1>
        <p className="text-sm text-slate-400 mt-1">
          Grant and revoke admin roles across SportSphere&apos;s 4-tier hierarchy —
          Super Admin (Tier 1), Directors (Tier 2), Specialists (Tier 3), and
          Moderators (Tier 4). Directors may only delegate within their own
          module.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Admins" value={stats.totalAdmins} accent="text-sky-300" hint="unique grantees" />
        <StatCard label="Active Grants" value={stats.activeRolesGranted} accent="text-emerald-300" hint="grants − revokes (recent)" />
        <StatCard label="Recent Revocations" value={stats.pendingRevocations} accent="text-red-300" hint="recent log entries" />
        <StatCard label="Directors Granted" value={stats.directors} accent="text-amber-300" hint="Tier 2 grants" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — Grant New Role form (60%) */}
        <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-[#0f141c] p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Grant New Role</h2>
          <p className="text-xs text-slate-400 mb-5">
            You can grant{' '}
            <span className="text-amber-300 font-medium">
              {grantableRoles.length}
            </span>{' '}
            of {allRoles.length} admin roles based on your current role
            {admin ? ` (${admin.role})` : ''}.
            {actorIsDirector && !actorIsSuperAdmin && (
              <> — directors may only grant Tier 3/4 roles in their own module.</>
            )}
          </p>

          <form onSubmit={handleGrant} className="space-y-4">
            {/* User search */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target User
              </label>
              <input
                type="text"
                value={userQuery}
                onChange={(e) => {
                  setUserQuery(e.target.value);
                  setSelectedUser(null);
                }}
                placeholder="Search by name, email, or handle…"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0b0e14] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
                disabled={granting}
              />
              {userSearchLoading && (
                <p className="text-[11px] text-slate-500 mt-1">Searching…</p>
              )}
              {!userSearchLoading && userResults.length > 0 && !selectedUser && (
                <div className="mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-[#0b0e14] divide-y divide-slate-800">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setUserQuery(`${u.name || u.handle} (${u.email})`);
                        setUserResults([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-slate-100 truncate">
                            {u.name || u.handle}
                            {u.isVerified && (
                              <span className="ml-1.5 text-[10px] text-emerald-300">✓</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {u.email} · @{u.handle}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase shrink-0">
                          {u.role}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div className="mt-1.5 text-[11px] text-emerald-300 flex items-center gap-1.5">
                  ✓ Selected: <span className="text-slate-200">{selectedUser.name}</span>
                  <span className="text-slate-500">({selectedUser.email})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setUserQuery('');
                    }}
                    className="ml-2 text-slate-500 hover:text-red-300"
                  >
                    clear
                  </button>
                </div>
              )}
            </div>

            {/* Role picker */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Admin Role
              </label>
              <select
                value={selectedRoleSlug}
                onChange={(e) => setSelectedRoleSlug(e.target.value)}
                disabled={granting || grantableRoles.length === 0}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0b0e14] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-400/60"
              >
                <option value="">— Select a role —</option>
                {([1, 2, 3, 4] as const).map((tier) =>
                  (rolesByTier[tier] || []).length > 0 ? (
                    <optgroup
                      key={tier}
                      label={`Tier ${tier} — ${tier === 1 ? 'Super Admin' : tier === 2 ? 'Directors' : tier === 3 ? 'Specialists' : 'Moderators'}`}
                    >
                      {(rolesByTier[tier] || []).map((r) => (
                        <option key={r.slug} value={r.slug}>
                          {r.name} ({r.slug})
                        </option>
                      ))}
                    </optgroup>
                  ) : null
                )}
              </select>
              {selectedRole && (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  <span className={moduleColor(selectedRole.module)}>
                    {selectedRole.module}
                  </span>{' '}
                  · scope:{' '}
                  <span className="text-slate-300">{selectedRole.scopeLevel}</span>
                  {selectedRole.description && (
                    <> — {selectedRole.description}</>
                  )}
                </p>
              )}
              {grantableRoles.length === 0 && !rolesLoading && (
                <p className="text-[11px] text-amber-300 mt-1.5">
                  Your current role cannot delegate any admin roles. Only
                  directors and super admins can grant roles.
                </p>
              )}
            </div>

            {/* Region/Language (conditional) */}
            <div className="grid grid-cols-2 gap-3">
              {selectedRole?.scopeLevel === 'regional' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Region Code <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
                    placeholder="e.g. EU, NA, AF"
                    maxLength={6}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0b0e14] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
                    disabled={granting}
                  />
                </div>
              )}
              {selectedRole?.scopeLevel === 'language' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Language Code <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={languageCode}
                    onChange={(e) => setLanguageCode(e.target.value)}
                    placeholder="e.g. en, fr, sw"
                    maxLength={6}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0b0e14] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
                    disabled={granting}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Notes <span className="text-slate-500">(optional, recorded in audit log)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Promoted to handle weekend on-call rotation…"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0b0e14] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 resize-y"
                disabled={granting}
              />
            </div>

            {/* Inline error / success */}
            {grantError && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-200">
                ⚠ {grantError}
              </div>
            )}
            {grantSuccess && (
              <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
                ✓ {grantSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={granting || !selectedUser || !selectedRoleSlug}
              className="w-full px-4 py-2.5 rounded-lg bg-amber-400 text-slate-900 text-sm font-semibold hover:bg-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {granting ? 'Granting…' : 'Grant Role'}
            </button>
          </form>
        </div>

        {/* RIGHT — Recent Delegation Activity (40%) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0f141c] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <button
              onClick={loadLogs}
              disabled={logsLoading}
              className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors"
            >
              {logsLoading ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Auto-refreshes every 30s · latest 20 entries
          </p>
          <div className="max-h-[420px] overflow-y-auto -mx-2 px-2">
            {logsLoading && logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">Loading…</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No delegation activity yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {logs.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-lg border border-slate-800 bg-[#0b0e14] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-semibold ${actionColor(log.action)}`}>
                        {log.action === 'grant' ? '↑ Grant' : log.action === 'revoke' ? '↓ Revoke' : log.action}
                      </span>
                      <span className="text-slate-500">{timeAgo(log.createdAt)}</span>
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-400">Actor:</span>{' '}
                      {log.actor?.name || log.actorId.slice(0, 8) + '…'}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-400">Target:</span>{' '}
                      {log.targetUser?.name || log.targetUserId.slice(0, 8) + '…'}
                    </div>
                    <div className="text-slate-300 mt-0.5">
                      <span className="text-slate-400">Role:</span>{' '}
                      {log.adminRole?.name || log.adminRoleSlug}{' '}
                      {log.adminRole && (
                        <span className={`ml-1 ${moduleColor(log.adminRole.module)}`}>
                          ({log.adminRole.module})
                        </span>
                      )}
                    </div>
                    {(log.regionCode || log.languageCode) && (
                      <div className="text-slate-500 mt-0.5">
                        scope: {log.regionCode || '-'} / {log.languageCode || '-'}
                      </div>
                    )}
                    {log.reason && (
                      <div className="text-slate-500 italic mt-1 truncate">
                        &ldquo;{log.reason}&rdquo;
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Active Admin Roles lookup section */}
      <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-6">
        <h2 className="text-lg font-semibold text-white mb-1">
          Active Admin Roles
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Search for a user to list every admin role they currently hold (active
          and revoked), with revoke buttons.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Find user
            </label>
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => {
                setLookupQuery(e.target.value);
                setLookupSelected(null);
              }}
              placeholder="Search name / email / handle…"
              className="w-full px-3 py-2.5 rounded-lg bg-[#0b0e14] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
            />
            {lookupLoading && (
              <p className="text-[11px] text-slate-500 mt-1">Searching…</p>
            )}
            {!lookupLoading && lookupResults.length > 0 && !lookupSelected && (
              <div className="mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-slate-700 bg-[#0b0e14] divide-y divide-slate-800">
                {lookupResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setLookupSelected(u);
                      setLookupQuery(`${u.name || u.handle} (${u.email})`);
                      setLookupResults([]);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="text-sm text-slate-100 truncate">
                      {u.name || u.handle}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {u.email} · @{u.handle}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {lookupSelected && (
              <p className="text-[11px] text-emerald-300 mt-1.5">
                Viewing roles for{' '}
                <span className="text-slate-200">{lookupSelected.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setLookupSelected(null);
                    setLookupQuery('');
                    setUserGrants([]);
                  }}
                  className="ml-2 text-slate-500 hover:text-red-300"
                >
                  clear
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Grants table */}
        {!lookupSelected ? (
          <div className="text-center py-12 text-sm text-slate-500">
            Select a user above to view their admin roles.
          </div>
        ) : userGrantsLoading ? (
          <div className="text-center py-12 text-sm text-slate-500">Loading grants…</div>
        ) : userGrants.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500">
            This user has no admin role grants on record.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-[#0b0e14] text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium">Role</th>
                  <th className="text-left px-3 py-2.5 font-medium">Module</th>
                  <th className="text-left px-3 py-2.5 font-medium">Scope</th>
                  <th className="text-left px-3 py-2.5 font-medium">Granted By</th>
                  <th className="text-left px-3 py-2.5 font-medium">Granted</th>
                  <th className="text-left px-3 py-2.5 font-medium">Status</th>
                  <th className="text-right px-3 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {userGrants.map((g) => {
                  const tb = tierBadge(g.adminRole.tier);
                  return (
                    <tr key={g.id} className="hover:bg-slate-800/30">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${tb.cls}`}
                          >
                            {tb.label}
                          </span>
                          <div>
                            <div className="text-slate-100 font-medium">
                              {g.adminRole.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {g.adminRoleSlug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 ${moduleColor(g.adminRole.module)}`}>
                        {g.adminRole.module}
                      </td>
                      <td className="px-3 py-2.5 text-slate-300 text-xs">
                        {g.regionCode
                          ? `Region: ${g.regionCode}`
                          : g.languageCode
                            ? `Lang: ${g.languageCode}`
                            : g.adminRole.scopeLevel === 'global'
                              ? 'Global'
                              : g.adminRole.scopeLevel}
                      </td>
                      <td className="px-3 py-2.5 text-slate-300 text-xs">
                        {g.assignedBy?.name || (
                          <span className="text-slate-500">
                            {g.assignedById ? g.assignedById.slice(0, 8) + '…' : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 text-xs">
                        {timeAgo(g.assignedAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        {g.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-500/15 text-slate-400 border-slate-500/30">
                            REVOKED
                          </span>
                        )}
                        {g.revokedAt && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {timeAgo(g.revokedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {g.isActive ? (
                          <button
                            type="button"
                            onClick={() => setRevokeTarget(g)}
                            className="text-[11px] text-red-300 hover:text-red-200 hover:bg-red-500/10 border border-red-500/30 rounded px-2 py-1 transition-colors"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke confirmation modal */}
      {revokeTarget && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4"
          onClick={() => !revoking && setRevokeTarget(null)}
        >
          <div
            className="rounded-xl border border-slate-700 bg-[#0f141c] max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-1">
              Confirm Revoke
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              You are about to revoke{' '}
              <span className="text-amber-300 font-medium">
                {revokeTarget.adminRole.name}
              </span>{' '}
              ({revokeTarget.adminRoleSlug}) from{' '}
              <span className="text-slate-200">
                {lookupSelected?.name || 'this user'}
              </span>
              . This will set the grant to inactive and log a revoke entry.
            </p>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Reason <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={2}
              placeholder="e.g. No longer on the moderation team…"
              className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 mb-4 resize-y"
              disabled={revoking}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setRevokeTarget(null);
                  setRevokeReason('');
                }}
                disabled={revoking}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={revoking}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-500/90 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {revoking ? 'Revoking…' : 'Revoke Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: number;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f141c] p-4">
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
        {label}
      </div>
      <div className={`text-3xl font-bold mt-1 ${accent}`}>{value}</div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

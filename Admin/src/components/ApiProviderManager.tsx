"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Save, Key, Link2, Plug } from "lucide-react";
import { adminFetch } from '@/lib/admin-api';

export type CustomProviderForm = {
  id: string;
  name: string;
  baseUrl: string;
  authType: "none" | "header" | "query";
  authHeaderName: string;
  authQueryParam: string;
  apiKey: string;
  extraHeaders: string;
  supportedSports: string;
  enabled: boolean;
  competitionsPath: string;
  fixturesPath: string;
  teamsPath: string;
  playersPath: string;
  dateParam: string;
  searchParam: string;
  competitionsListPath: string;
  fixturesListPath: string;
  teamsListPath: string;
  playersListPath: string;
  notes: string;
  apiKeySet?: boolean;
};

const empty: CustomProviderForm = {
  id: "",
  name: "",
  baseUrl: "",
  authType: "header",
  authHeaderName: "x-rapidapi-key",
  authQueryParam: "api_token",
  apiKey: "",
  extraHeaders: '{"x-rapidapi-host":""}',
  supportedSports: "football",
  enabled: true,
  competitionsPath: "",
  fixturesPath: "",
  teamsPath: "",
  playersPath: "",
  dateParam: "date",
  searchParam: "search",
  competitionsListPath: "response.leagues",
  fixturesListPath: "response.matches",
  teamsListPath: "response.suggestions",
  playersListPath: "response.suggestions",
  notes: "",
};

export default function ApiProviderManager({
  onProvidersChanged,
}: {
  onProvidersChanged?: (ids: { id: string; name: string }[]) => void;
}) {
  const [list, setList] = useState<CustomProviderForm[]>([]);
  const [form, setForm] = useState<CustomProviderForm>(empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  const load = async () => {
    try {
      const res = await adminFetch("/api/admin/api-providers", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load providers");
        return;
      }
      setList(data.providers || []);
      onProvidersChanged?.(
        (data.providers || [])
          .filter((p: any) => p.enabled)
          .map((p: any) => ({ id: `custom-${p.id}`, name: p.name }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k: keyof CustomProviderForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const edit = (p: any) => {
    setForm({
      ...empty,
      ...p,
      apiKey: "",
      extraHeaders:
        typeof p.extraHeaders === "object"
          ? JSON.stringify(p.extraHeaders)
          : p.extraHeaders || "",
      supportedSports: Array.isArray(p.supportedSports)
        ? p.supportedSports.join(", ")
        : p.supportedSports || "football",
      authHeaderName: p.authHeaderName || "x-rapidapi-key",
      authQueryParam: p.authQueryParam || "api_token",
    });
    setMsg(`Editing ${p.name}`);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const res = await adminFetch("/api/admin/api-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          apiKey: form.apiKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setMsg(`Saved ${data.provider?.name || form.name}`);
      setForm(empty);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(`Delete provider ${id}?`)) return;
    const res = await adminFetch(`/api/admin/api-providers?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Delete failed");
    else {
      setMsg("Deleted");
      await load();
    }
  };

  const field = (
    label: string,
    key: keyof CustomProviderForm,
    opts?: { placeholder?: string; type?: string }
  ) => (
    <label className="block text-xs space-y-1">
      <span className="text-slate-400 font-medium">{label}</span>
      <input
        type={opts?.type || "text"}
        value={String(form[key] ?? "")}
        onChange={(e) => set(key, e.target.value)}
        placeholder={opts?.placeholder}
        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm"
      />
    </label>
  );

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-100 flex items-center gap-2">
            <Plug className="w-4 h-4 text-amber-400" />
            Add API provider (no code)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Register a new HTTP sports API with name, URL, keys, and endpoint paths. Enable it, then select it in Providers above and Run sync.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300"
        >
          {open ? "Collapse" : "Expand"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-rose-300 border border-rose-500/30 bg-rose-500/10 rounded-lg p-3">
          {error}
        </div>
      )}
      {msg && (
        <div className="text-sm text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-3">
          {msg}
        </div>
      )}

      {open && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {field("API name *", "name", { placeholder: "My Football API" })}
            {field("Provider id (slug)", "id", { placeholder: "auto from name" })}
            {field("Base URL *", "baseUrl", {
              placeholder: "https://api.example.com/v1",
            })}
            <label className="block text-xs space-y-1">
              <span className="text-slate-400 font-medium">Auth type</span>
              <select
                value={form.authType}
                onChange={(e) => set("authType", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
              >
                <option value="none">None</option>
                <option value="header">Header key</option>
                <option value="query">Query param</option>
              </select>
            </label>
            {form.authType === "header" &&
              field("Auth header name", "authHeaderName", {
                placeholder: "x-rapidapi-key",
              })}
            {form.authType === "query" &&
              field("Auth query param", "authQueryParam", {
                placeholder: "api_token",
              })}
            <label className="block text-xs space-y-1 md:col-span-2">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Key className="w-3 h-3" /> API key / token
                {form.apiKeySet ? " (set — leave blank to keep)" : ""}
              </span>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => set("apiKey", e.target.value)}
                placeholder="paste key"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
              />
            </label>
            {field("Extra headers (JSON)", "extraHeaders", {
              placeholder: '{"x-rapidapi-host":"…"}',
            })}
            {field("Sports (comma)", "supportedSports", {
              placeholder: "football",
            })}
          </div>

          <div className="border-t border-slate-800 pt-3">
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Endpoint paths (relative to base URL)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {field("Competitions path", "competitionsPath", {
                placeholder: "football-get-all-leagues",
              })}
              {field("Competitions list path", "competitionsListPath", {
                placeholder: "response.leagues",
              })}
              {field("Fixtures path", "fixturesPath", {
                placeholder: "football-get-matches-by-date",
              })}
              {field("Fixtures list path", "fixturesListPath", {
                placeholder: "response.matches",
              })}
              {field("Teams path", "teamsPath", {
                placeholder: "football-teams-search",
              })}
              {field("Teams list path", "teamsListPath", {
                placeholder: "response.suggestions",
              })}
              {field("Players path", "playersPath", {
                placeholder: "football-players-search",
              })}
              {field("Players list path", "playersListPath", {
                placeholder: "response.suggestions",
              })}
              {field("Date query param", "dateParam", { placeholder: "date" })}
              {field("Search query param", "searchParam", {
                placeholder: "search",
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => set("enabled", e.target.checked)}
            />
            Enabled for sync
          </label>

          {field("Notes", "notes", { placeholder: "optional" })}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save API"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(empty);
                setMsg(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Saved providers ({list.length})
            </div>
            {list.length === 0 && (
              <p className="text-xs text-slate-600">None yet — use the form above.</p>
            )}
            {list.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/50 text-sm"
              >
                <div>
                  <div className="text-slate-100 font-medium">
                    {p.name}{" "}
                    <span className="text-slate-500 text-xs">custom-{p.id}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-md">
                    {p.baseUrl} · {p.enabled ? "enabled" : "disabled"} ·{" "}
                    {p.apiKeySet ? "key set" : "no key"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => edit(p)}
                    className="text-xs px-2 py-1 rounded-lg border border-slate-700 text-slate-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(p.id)}
                    className="text-xs px-2 py-1 rounded-lg border border-rose-500/40 text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

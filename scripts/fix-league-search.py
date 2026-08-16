#!/usr/bin/env python3
"""Add search-as-you-type to League Name field in Create Competition form."""
import paramiko

HOST, USER, PASS = '104.152.50.173', 'deploy', 'Rehema@1234!'
FILE = '/var/www/sportsphere-nextjs/Admin/src/app/dashboard/create-competition/page.tsx'

def ssh_cmd(cmd, timeout=60):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=timeout)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    client.close()
    return out, err

out, err = ssh_cmd(f'cat {FILE}')
if err:
    print(f"Error: {err}")
    exit(1)

content = out

# ─────────────────────────────────────────────────
# 1) Add useRef, Search icon import
# ─────────────────────────────────────────────────
old_import = "import React, { useEffect, useState } from \"react\";"
new_import = "import React, { useEffect, useRef, useState } from \"react\";"
content = content.replace(old_import, new_import)

# ─────────────────────────────────────────────────
# 2) Add league search state + dropdown ref
# ─────────────────────────────────────────────────
old_state = """  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);"""
new_state = """  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [nameSearchOpen, setNameSearchOpen] = useState(false);
  const nameInputRef = useRef<HTMLDivElement>(null);"""
content = content.replace(old_state, new_state)

# ─────────────────────────────────────────────────
# 3) Add click-outside handler to close dropdown
#    Insert after the duplicate check useEffect
# ─────────────────────────────────────────────────
old_dup_check = """  }, [form.name, allLeagues]);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));"""
new_dup_check = """  }, [form.name, allLeagues]);

  // Close name search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (nameInputRef.current && !nameInputRef.current.contains(e.target as Node)) setNameSearchOpen(false);
    };
    if (nameSearchOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [nameSearchOpen]);

  // Filtered existing leagues based on name input
  const nameSuggestions = form.name.trim().length >= 1
    ? allLeagues
        .filter((l) => l.name.toLowerCase().includes(form.name.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));"""
content = content.replace(old_dup_check, new_dup_check)

# ─────────────────────────────────────────────────
# 4) Replace the plain Name input with searchable dropdown
# ─────────────────────────────────────────────────
old_name_input = """            <label className="block text-xs space-y-1 md:col-span-2">
              <span className="text-slate-400">Name *</span>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
                placeholder="Premier League / AFCON / Champions Cup"
              />
            </label>"""

new_name_input = """            <label className="block text-xs space-y-1 md:col-span-2">
              <span className="text-slate-400">League / Competition Name *</span>
              <div className="relative" ref={nameInputRef}>
                <input
                  required
                  value={form.name}
                  onChange={(e) => { set("name", e.target.value); setNameSearchOpen(true); }}
                  onFocus={() => setNameSearchOpen(true)}
                  className={inputCls + " pr-8"}
                  placeholder="Type to search existing or enter new name..."
                />
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                {nameSearchOpen && nameSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/50">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider border-b border-slate-800">
                      Existing Competitions ({allLeagues.filter((l) => l.name.toLowerCase().includes(form.name.trim().toLowerCase())).length})
                    </div>
                    {nameSuggestions.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => { set("name", l.name); setNameSearchOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-amber-500/10 hover:text-amber-100 transition-colors flex items-center gap-2 border-b border-slate-800/50 last:border-0"
                      >
                        <svg className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {l.name}
                      </button>
                    ))}
                  </div>
                )}
                {nameSearchOpen && form.name.trim().length >= 1 && nameSuggestions.length === 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/50 px-3 py-2.5 text-xs text-slate-400">
                    No existing match — this will create a new competition
                  </div>
                )}
              </div>
            </label>"""

content = content.replace(old_name_input, new_name_input)

# Verify
if "Type to search existing or enter new name..." not in content:
    print("ERROR: New name input not found!")
    exit(1)
if "nameSuggestions" not in content:
    print("ERROR: nameSuggestions logic missing!")
    exit(1)
if "nameSearchOpen" not in content:
    print("ERROR: nameSearchOpen state missing!")
    exit(1)

print("All checks passed!")

# Write back
encoded = content.encode('utf-8').hex()
ssh_cmd(f"echo '{encoded}' | xxd -r -p > {FILE}")
print(f"File written: {len(content)} chars")

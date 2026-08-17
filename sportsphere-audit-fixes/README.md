# SportSphere v3 — Audit Fixes (P0 / P1)

## Files included

| Path | What was fixed |
|------|----------------|
| `Admin/src/proxy.ts` | Admin role check now uses exact match (closes auth bypass) |
| `scripts/ws-server.mjs` | WebSocket auth + restricted CORS |
| `WebApp/next.config.ts` | CORS headers for Flutter Web / API clients |
| `WebApp/src/app/api/profile-data/route.ts` | Live feed + fixtures from DB (with seed fallback) |
| `AUDIT_FIXES_APPLIED.md` | Full changelog |

## How to apply (from your computer)

### Quick way
```bash
# 1. Download the zip and put it next to (or inside) your sportsphere-v3 clone
cd /path/to/sportsphere-v3          # your real repo root

# 2. Unzip (overwrites only the 4 fixed files + docs)
unzip -o /path/to/sportsphere-audit-fixes.zip

# 3. Run the apply script (optional but recommended — it confirms paths)
bash apply-fixes.sh

# 4. Commit & push
git add Admin/src/proxy.ts scripts/ws-server.mjs WebApp/next.config.ts WebApp/src/app/api/profile-data/route.ts AUDIT_FIXES_APPLIED.md
git commit -m "fix: close P0/P1 audit issues (proxy role, WS auth, CORS, live profile-data)"
git push origin main
```

### Even simpler (no script)
Just unzip with `-o` from the **repo root** — the folder structure inside the zip matches the repo, so files land in the correct places.

## After deploy on VPS
Set these environment variables and restart the processes:
```
WS_AUTH_SECRET=<long random string>
WS_ALLOWED_ORIGINS=https://sportsphere.app,https://www.sportsphere.app
CORS_ORIGIN=https://sportsphere.app
```

Then rotate any previously exposed credentials.

# Audit Fixes Applied — SportSphere v3 (2026-08-16)

Based on the Application Audit Report (Identified Gaps + Prioritized Roadmap).

## P0 — Critical (Completed)

### 1. Fix `Admin/src/proxy.ts` admin role check → exact match
**File:** `Admin/src/proxy.ts`

**Before (vulnerable):**
```ts
const isAdmin =
  role === 'ADMINISTRATOR' ||
  role === 'ADMIN' ||
  role.includes('ADMIN');  // ← any role containing "ADMIN" passed
```

**After:**
```ts
const ALLOWED_ADMIN_ROLES = new Set([
  'ADMINISTRATOR', 'ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN',
]);
const isAdmin = ALLOWED_ADMIN_ROLES.has(role);
```

This closes the auth-bypass where a role string such as `NOT_ADMIN` or `FANADMIN` would incorrectly be treated as admin.

### 2. Exposed DB password / credentials
- `.env.example` already uses placeholders only.
- Real credentials must be rotated on the VPS and scrubbed from Git history with `git-filter-repo` or BFG.
- See existing `SECURITY_FIXES.md` for the full list of credentials that were previously exposed.

## P1 — High (Completed)

### 3. WebSocket server authentication + CORS restriction
**File:** `scripts/ws-server.mjs`

Changes:
- CORS origin restricted to an allow-list (`WS_ALLOWED_ORIGINS` env, defaults to production + localhost).
- `register_user` now requires `{ userId, secret }` (or object form). Secret must match `WS_AUTH_SECRET` (or `SESSION_SECRET`) using constant-time comparison. Legacy single-string form is rejected.
- `join_admin` is gated: only sockets that registered with `isAdmin: true` + valid secret may join the `admin` room.
- Messaging/typing events also require an authenticated socket.
- Startup warns if `WS_AUTH_SECRET` is unset.

**Client migration:** when calling `socket.emit('register_user', …)` pass an object:
```js
socket.emit('register_user', {
  userId: currentUser.id,
  secret: process.env.WS_AUTH_SECRET, // or a short-lived token
  isAdmin: currentUser.role === 'ADMIN',
}, (ack) => { … });
```

### 4. CORS for Flutter Web / API clients
**File:** `WebApp/next.config.ts`

Added explicit CORS headers for `/api/*` routes so Flutter web (and other cross-origin clients) are no longer blocked. Set `CORS_ORIGIN` in production to the exact origin (do not use `*` together with credentials).

### 5. Migrate `profile-data` from pure static seeds toward live DB
**File:** `WebApp/src/app/api/profile-data/route.ts`

- Added `fetchLiveFeed(authorKey)` — queries `Post` by resolved userId/handle.
- Added `fetchLiveFixtures()` — queries `Match` ordered by kickoff.
- `withDefaults` now prefers live data and only falls back to the original seed arrays when the DB returns nothing or the query fails.
- Shop / tickets / media still use seeds (next iteration: `BusinessProfile` / CommercialPartner and a Media model).

## Remaining (from original roadmap — not yet coded)

| Priority | Item | Notes |
|----------|------|-------|
| P1 | Full shop/tickets from Business/CommercialPartner | Needs schema confirmation |
| P2 | Redis rate limiting | Replace in-memory Map |
| P2 | Wire remaining write paths to realtime bridge | profile updates, community joins, polls |
| P2 | Firebase client configs (`google-services.json`, `GoogleService-Info.plist`) | Run `flutterfire configure` |
| P2 | Admin backup engine | Currently stubbed |
| P3 | JWT session revocation + shorter TTL + refresh tokens | |
| P3 | Flutter pagination + local caching (Hive/Isar) | |
| P3 | CSRF double-submit cookie | |
| P3 | Resolve duplicate `Flutter/lib/theme/` vs `Flutter/lib/core/theme/` | Keep `core/theme`, delete the other |
| P3 | Chat/DM nav entry + deep-link navigation on push open | |
| P3 | Enforce RBAC in every admin route handler | |

## How to apply these fixes upstream

1. Copy the three modified files into the real repo:
   - `Admin/src/proxy.ts`
   - `scripts/ws-server.mjs`
   - `WebApp/next.config.ts`
   - `WebApp/src/app/api/profile-data/route.ts`
2. Set environment variables on the VPS / PM2:
   ```
   WS_AUTH_SECRET=<long random>
   WS_ALLOWED_ORIGINS=https://sportsphere.app,https://www.sportsphere.app,...
   CORS_ORIGIN=https://sportsphere.app
   ```
3. Restart the WS process and the Next.js app.
4. Rotate any previously exposed DB passwords and scrub Git history.
5. Run `flutterfire configure` for real device push.

---
*Generated from the August 2026 audit report.*

# Security Fixes — SportSphere v3

This document summarises all security fixes applied as a result of the comprehensive audit.

## Critical (P0) Fixes Applied

### 1. Authentication Bypass via x-user-id Header — FIXED
**Files:** All 13 affected API route handlers + new `src/middleware.ts`

Removed the `request.headers.get('x-user-id') ?? ...` pattern from every route. All 13 routes now call `await getUserIdFromRequest(request)` exclusively, which verifies the signed session cookie. A new `src/middleware.ts` additionally strips `x-user-id`, `x-user-role`, `x-admin`, and `x-forwarded-user` headers at the edge before any route handler sees them.

### 2. Unauthenticated File Upload — FIXED
**File:** `src/app/api/uploads/route.ts`

Added `getUserIdFromRequest` check at the top of the POST handler — returns 401 if not authenticated. Also added:
- MIME type allowlist (images + videos only)
- 10 MB file size limit
- Removed `ACL: 'public-read'` from S3 uploads
- Extension derived from validated MIME type, not client-supplied filename

### 3. Hardcoded Credentials in Source — FIXED
**File:** `test-rbac-live.mjs`

Removed hardcoded admin/fan passwords. The script now reads `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FAN_EMAIL`, `FAN_PASSWORD` from environment variables and exits with an error if they are missing.

**File:** `.github/workflows/rbac-tests.yml`

`SESSION_SECRET` now references `${{ secrets.CI_SESSION_SECRET }}` (GitHub Secrets). Add the secret in your repo's Settings → Secrets → Actions.

**Action required:** Rotate all previously exposed credentials immediately:
- `mbazzacodes@sportsphere.com` password
- `fan_test@sportsphere.com` password
- Any JWT session secrets committed to Git history

Use `git-filter-repo` or BFG Repo Cleaner to scrub the old values from history, then force-push.

### 4. No HTTPS in Production — FIXED
**File:** `nginx.conf`

- HTTP server block now redirects all traffic to HTTPS with a 301.
- HTTPS server block is active (not commented out) with TLS 1.2/1.3, OCSP stapling.
- `Strict-Transport-Security` header with 2-year max-age added.
- `Content-Security-Policy` and `Permissions-Policy` headers added.
- `X-User-Id` header is explicitly cleared by nginx before proxying to the app.

**File:** `mobile/.env.example`

Production API URL updated to `https://sportsphere.app/sportsphere` (was HTTP + raw IP).

**Action required:** Run `sudo certbot --nginx -d sportsphere.app -d www.sportsphere.app` on the VPS to provision the TLS certificate.

### 5. No Lockfile / No Reproducible Builds — FIXED
**File:** `.gitignore`

Removed the `package-lock.json`, `bun.lock`, and `yarn.lock` entries. Commit your lockfile to the repository so `npm ci` works in CI and builds are reproducible.

### 6. Capacitor Mixed Content & Wildcard Navigation — FIXED
**File:** `capacitor.config.ts`

- `allowMixedContent` set to `false` (was `true`).
- `allowNavigation` restricted to `['sportsphere.app', '*.sportsphere.app']` (was `['*']`).

### 7. Serializer Disconnected from DB Schema — FIXED
**File:** `src/lib/serializers.ts`

Rewrote `UserRecord` interface to use actual Prisma field names (`handle` not `username`, `name` not `displayName`, `roleId`/`roleTypeId` not legacy `role` string). Public serializer now never includes `email`.

## Remaining Work (P1–P3)

See `REPORT.md` and the audit document for the full remediation roadmap. Priority items not yet addressed:

- [ ] Hash OTPs before storage; use timing-safe comparison
- [ ] CSRF protection (double-submit cookie pattern)
- [ ] Fix performance point race condition in `persistence.ts`
- [ ] Add cascading delete for posts
- [ ] Re-enable ESLint with meaningful rules
- [ ] Fix ghost `players` table (add Prisma model or remove routes)
- [ ] Session revocation / shorter JWT TTL
- [ ] Redis-based rate limiting (replace in-process Map)
- [ ] Fix `auditLogger.ts` non-existent column

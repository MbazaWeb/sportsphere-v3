# Sportsphere v3 — Security & Mobile UX Fixes

All files are ready to copy into your repo. Apply them in priority order.

---

## 🔴 Fix 1 — Admin Routes Protected at Edge (`proxy.ts`)

**File:** `proxy.ts` (repo root, or `src/proxy.ts` if you use a src dir)

**What changed:** The exported function is renamed from `middleware` → `proxy`
(required by Next.js 16). Added JWT verification + admin role check so
unauthenticated users hitting `/sportsphere/admin/*` are redirected to `/login`
and non-admin authenticated users get a `/403` redirect.

**Note:** The original audit said to rename to `middleware.ts`. That was wrong.
`proxy.ts` IS the correct file for Next.js 16. Do **not** rename it.

**Steps:**
1. Copy `proxy.ts` from this package over your existing `proxy.ts`.
2. Set `JWT_SECRET` in your `.env` (it should already be there).
3. Adjust `PROTECTED_PREFIXES` and `ADMIN_PREFIXES` to match your actual
   route paths.

---

## 🔴 Fix 2 — Email Removed from Public User Listing (`lib/serializers.ts`)

**Files:** `lib/serializers.ts`

**What changed:** `serializePublicUser()` no longer includes `email`, `phone`,
or `whatsapp`. A new `serializePrivateUser()` is provided for the user's own
profile endpoint.

**Steps:**
1. Copy `lib/serializers.ts` into your repo.
2. Find every call to your current `serializePublicUser` and replace the
   function body with the one in the new file. Adjust field names to match
   your Prisma schema.
3. In your own-profile route (`GET /api/users/me` or similar), switch to
   `serializePrivateUser(user)` so the authenticated user still sees their
   own email.

---

## 🔴 Fix 3 — Rate Limiting on Auth Routes (`lib/rate-limit.ts`)

**Files:** `lib/rate-limit.ts`, auth route examples

**What changed:** A lightweight sliding-window rate limiter is added. Auth
routes now return `429 Too Many Requests` after the limit is hit.

**Steps:**
1. Copy `lib/rate-limit.ts` into your repo.
2. In your **login** route: add the rate-limit block from
   `app/api/auth/login/route.ts` (the section between the `// ── ADD` comments).
3. In your **register** route: add the block from
   `app/api/auth/register/route.ts`.
4. In your **forgot-password** route: replace with
   `app/api/auth/forgot-password/route.ts` (also includes Fix #4).

**Production note:** The in-memory store resets when the process restarts.
For multi-instance deployments, replace the Map with
`@upstash/ratelimit` + Upstash Redis:
```
bun add @upstash/ratelimit @upstash/redis
```

---

## 🟡 Fix 4 — Reset Token Hashed Before DB Storage

**Files:** `lib/auth-helpers.ts`, `app/api/auth/forgot-password/route.ts`

**What changed:** `generateResetToken()` returns both a `rawToken` (sent in
email URL) and a `hashedToken` (stored in DB). Verification hashes the
submitted token before comparing — DB leak no longer exposes usable tokens.

**Steps:**
1. Copy `lib/auth-helpers.ts` into your repo.
2. In your forgot-password route, replace `resetToken` storage with
   `hashedToken` (see `app/api/auth/forgot-password/route.ts`).
3. In your reset-password route (where the token is consumed), replace the
   direct DB lookup with `hashResetToken(submittedToken)` then query.

---

## 🟡 Fix 5 — Admin Role Check Changed to Exact Match (`lib/auth-helpers.ts`)

Already included in `lib/auth-helpers.ts` (`verifyAdminSession()`).

**What changed:** Replaced `role.includes("ADMIN")` with an exact-match
allowlist (`Set<string>`). A role like "community-admin" no longer gains
admin access.

**Steps:**
1. Find every `verifyAdminSession()` call in your API routes.
2. Replace the implementation with the one in `lib/auth-helpers.ts`.
   (Or just import and call the new `verifyAdminSession` from there.)

---

## 🟡 Fix 6 — Dead Players Raw SQL Routes

**File:** `app/api/players/README.md`

Read the README for options. Either delete the routes or rewrite them
against `PlayerProfile` using Prisma's query builder.

---

## 🔵 Fix 7 — HTTPS + Secure Cookie Flag

1. Set up Let's Encrypt via your Nginx config (Phase I in your roadmap).
2. The login route fix (`app/api/auth/login/route.ts`) already sets
   `secure: process.env.NODE_ENV === "production"` — the cookie will
   automatically use the `Secure` flag once you're on HTTPS.

---

## 📱 Fix 8 — Mobile UX: Swipe Back / Screen Shake / Rotation

### A. CSS fixes (screen shake, keyboard jitter, tap highlight)

1. Copy `public/mobile-ux-fixes.css` into your project.
2. Import it in your global CSS file:
   ```css
   @import "../public/mobile-ux-fixes.css";
   ```
   Or add a `<link>` in `app/layout.tsx`.

3. Update your viewport meta tag in `app/layout.tsx`:
   ```tsx
   // In your metadata export or <head>:
   <meta
     name="viewport"
     content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
   />
   ```
   > `maximum-scale=1` prevents iOS from auto-zooming on input focus.
   > `viewport-fit=cover` prevents viewport resize on orientation change.

### B. Swipe-back guard (stops accidental back-navigation in forms)

1. Copy `components/SwipeGuard.tsx` into your `components/` folder.
2. Wrap every page that has a form:
   ```tsx
   import { SwipeGuard } from "@/components/SwipeGuard";

   export default function LoginPage() {
     return (
       <SwipeGuard>
         <LoginForm />
       </SwipeGuard>
     );
   }
   ```
3. For the most aggressive protection, wrap the entire app in
   `app/layout.tsx`:
   ```tsx
   <SwipeGuard edgeWidth={40}>
     {children}
   </SwipeGuard>
   ```

### C. Orientation lock (stops rotation)

1. Copy `hooks/useOrientationLock.ts` into your `hooks/` folder.
2. Call it in your root client layout:
   ```tsx
   "use client";
   import { useOrientationLock } from "@/hooks/useOrientationLock";

   export function MobileShell({ children }: { children: React.ReactNode }) {
     useOrientationLock("portrait");
     return <>{children}</>;
   }
   ```
   Then wrap `{children}` in `app/layout.tsx` with `<MobileShell>`.

> The orientation lock only works in fullscreen / PWA mode on iOS Safari.
> The CSS `@media (orientation: landscape)` rule in `mobile-ux-fixes.css`
> provides a visual fallback for regular browser tabs.

---

## Summary of files in this package

| File | Fix |
|------|-----|
| `proxy.ts` | #1 Admin route protection at edge |
| `lib/serializers.ts` | #2 Email removed from public users |
| `lib/rate-limit.ts` | #3 Rate limiting |
| `lib/auth-helpers.ts` | #4 Hashed tokens · #5 Exact role check |
| `app/api/auth/login/route.ts` | #3 #7 Rate limit + Secure cookie |
| `app/api/auth/register/route.ts` | #3 Rate limit |
| `app/api/auth/forgot-password/route.ts` | #3 #4 Rate limit + token hash |
| `app/api/players/README.md` | #6 Fix dead SQL routes |
| `public/mobile-ux-fixes.css` | Mobile shake/rotation |
| `components/SwipeGuard.tsx` | Mobile swipe-back guard |
| `hooks/useOrientationLock.ts` | Orientation lock |

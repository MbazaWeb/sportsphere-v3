# Sportsphere Platform Architecture

> Locked architecture: **Flutter (Android + iOS) + Web + Admin**, sharing one backend and one source of truth.

```
                              SPORTSPHERE
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
          USER ECOSYSTEM                      ADMIN ECOSYSTEM
                 │                                 │
       ┌─────────┼─────────┐                  WEB ONLY
       │         │         │                    │
    Android      iOS      Web               Admin Portal
       │         │         │                    │
       └─────────┼─────────┘                    │
                 │                              │
                 └──────────┬───────────────────┘
                            │
                       SHARED API
                            │
                 ┌──────────┴──────────┐
                 │                     │
             DATABASE              SERVICES
                 │                     │
        ┌────────┼─────────┐    ┌──────┼────────┐
        │        │         │    │      │        │
      Auth     Sports    Users  Media Payments Notifications
```

## 1. Current Repo Mapping

The existing `sportsphere-v3` repository is a single Next.js 16 application that contains **both** the user web client and the admin portal. The sole native mobile client is the Flutter app in `/Flutter/` (Android + iOS). The previous Expo/React Native and Capacitor approaches have been removed.

| Target                                  | Current Location                                          | Status                                  |
| --------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| User Web App                            | `/` (Next.js app at repo root)                            | **Production-ready** — keep as-is       |
| Admin Web Portal                        | `/src/app/admin/*` (co-deployed in same Next.js app)      | **Functional** — RBAC-isolated          |
| Android / iOS Native App                | `/Flutter/` (Flutter + Riverpod)                          | **Active development** — primary mobile client |
| Shared Design System                    | Hardcoded in `/src/app/globals.css`                       | **Extracting** to `/packages/design-system/` |
| Shared TypeScript Types                 | Inline in `/src/types/`, `/src/lib/performance-engine/types.ts` | **Extracting** to `/packages/types/`    |
| Shared API Client                       | Inline fetch calls scattered across components            | **Extracting** to `/packages/api-client/` |
| Backend API                             | `/src/app/api/*` (Next.js Route Handlers)                 | **Shared** by all 4 clients             |
| Database                                | Prisma schema at `/prisma/schema.prisma`                  | **Shared**                              |

## 2. Target Repository Structure

We are moving toward this layout **incrementally** — the existing Next.js app is NOT being moved or restructured. New top-level directories are being added alongside the existing app:

```
sportsphere-v3/
│
├── src/                          # ← EXISTING Next.js app (User Web + Admin Web, co-deployed)
│   ├── app/
│   │   ├── (user)/               #     User-facing routes (future split marker)
│   │   ├── admin/                #     Admin portal routes (already RBAC-isolated)
│   │   └── api/                  #     Shared backend API
│   ├── components/
│   └── lib/
│
├── Flutter/                      # ← Flutter app (Android + iOS) — sole native mobile client
│   ├── lib/                      #     Dart source (features, core, shared, theme)
│   ├── android/ / ios/           #     Platform projects
│   ├── assets/                   #     Images, icons
│   └── pubspec.yaml
│
├── packages/                     # ← Shared code primarily for web + admin (TypeScript)
│   ├── design-system/            #     Brand tokens (colors, type, spacing) as platform-agnostic JS
│   ├── types/                    #     Shared TS types (User, Player, Match, PerformanceProfile, ...)
│   ├── api-client/               #     Typed fetch wrapper targeting the Next.js API
│   ├── validation/               #     Zod schemas (planned)
│   └── config/                   #     Shared env/runtime config (planned)
│
├── prisma/                       # ← EXISTING: shared database schema + migrations
├── public/                       # ← EXISTING: web static assets
├── scripts/                      # ← EXISTING: deployment + ops scripts
│
├── ARCHITECTURE.md               # ← This document
└── package.json                  # ← EXISTING: web app deps
```

## 3. Client Responsibilities

| Platform      | Purpose                            | Tech                                             | Status            |
| ------------- | ---------------------------------- | ------------------------------------------------ | ----------------- |
| **Android**   | Primary mobile user experience     | Flutter + Riverpod + Material / custom theme     | Active development |
| **iOS**       | Apple mobile user experience       | Same Flutter codebase (single source)            | Active development |
| **Web App**   | User browser experience            | Next.js 16 + React 19 + Tailwind v4 + Radix UI   | Production-ready  |
| **Admin Web** | Platform operations and management | Same Next.js codebase, `/admin/*` routes, RBAC-gated | Production-ready  |

## 4. Shared Backend

One backend serves all clients (Flutter mobile, Web, Admin). The Next.js Route Handlers at `/src/app/api/*` are the single API surface:

```
Flutter ──────┐
(Android/iOS)  ├──> Next.js API (/api/*) ──> Prisma ──> Database
Web ──────────┤
Admin Web ────┘
```

Admin routes (`/api/admin/*`) live in the same Next.js app but are protected by an additional RBAC layer (`MODERATOR` or `ADMIN` role required, enforced via `src/lib/adminGuard.ts`). This satisfies the "separate authorization boundary" requirement without splitting the backend.

**Future option:** if admin traffic grows or security review demands physical separation, the `/admin/*` routes can be split into a separate Next.js app (`apps/admin/`) — the RBAC layer already isolates them logically.

## 5. Shared User Identity

A single `User` record (Prisma model in `prisma/schema.prisma`) backs every client. The same JWT session can be issued to mobile clients via the existing `/api/auth/*` endpoints — mobile only needs to:

1. POST `/api/auth/login` with email + password → receive JWT
2. Store JWT in SecureStore (Expo) / httpOnly cookie (web)
3. Send `Authorization: Bearer <jwt>` on every API call

```
User ID: SP-102938

Profile          → shared across all clients
Performance      → shared
Ranking          → shared
Following        → shared
Notifications    → shared
Subscriptions    → shared
Payment history  → shared
```

## 6. Shared Design Language

The Sportsphere brand identity is extracted into `packages/design-system/` as **platform-agnostic JS tokens**, then consumed by:

- **Web** — Tailwind v4 CSS variables (existing `globals.css` is the source of truth for now; the package exports the same values as JS for parity)
- **Mobile (RN)** — NativeWind v4 + `StyleSheet.create` using the same tokens

| Token         | Value                                                |
| ------------- | ---------------------------------------------------- |
| `background`  | `#0A1628` (dark navy)                                |
| `background2` | `#0F1D3A`                                            |
| `primary`     | `#F5C518` (gold)                                     |
| `primaryDark` | `#D4A800`                                            |
| `primaryLight`| `#FFD700`                                            |
| `accent`      | `#FF6B35` (vibrant orange)                           |
| `destructive` | `#FF453A`                                            |
| `card`        | `rgba(255, 255, 255, 0.05)` (glass)                  |
| `border`      | `rgba(255, 255, 255, 0.08)`                          |
| `radius`      | `0.75rem`                                            |
| `fontDisplay` | `Outfit`                                             |
| `fontBody`    | `Inter`                                              |

The same visual language — dark navy gradient bg, gold gradient text, glass cards, gold glow, premium rotating border — is replicated on every platform.

## 7. Mobile App Stack (Expo + React Native)

| Concern              | Library                                             | Why                                          |
| -------------------- | --------------------------------------------------- | -------------------------------------------- |
| Framework            | Expo SDK 52                                         | Cross-platform native (Android+iOS)          |
| Routing              | Expo Router v4                                      | File-based — matches Next.js mental model    |
| Styling              | NativeWind v4                                       | Tailwind syntax on RN — preserves brand CSS  |
| Animations           | React Native Reanimated v3                          | Native-feeling gestures, springs, layout     |
| Icons                | `lucide-react-native`                               | Same icon set as web (`lucide-react`)        |
| State                | Zustand                                             | Same as web (`zustand` already in deps)      |
| Data fetching        | TanStack Query v5 (planned)                         | Caching, retries, background sync            |
| Storage              | `expo-secure-store`                                 | JWT + sensitive tokens                       |
| Auth                 | `packages/api-client` → `/api/auth/*`               | Same backend, same identity                  |
| Image handling       | `expo-image`                                        | Fast, cached, blur-up placeholders           |
| Haptics              | `expo-haptics`                                      | Native feedback on actions                   |
| Fonts                | `expo-google-fonts` (Outfit + Inter)                | Brand typography parity                      |

## 8. Migration Plan (Incremental)

The migration is **non-breaking**. Each phase ships independently.

### Phase A — Shared Packages (current)
- Extract brand tokens → `packages/design-system/`
- Extract TS types → `packages/types/`
- Build typed API client → `packages/api-client/`
- Web app continues to import from `src/` as before; new code can opt into `packages/`

### Phase B — Mobile Bootstrap (current)
- Initialize Expo app at `mobile/`
- Configure NativeWind with brand tokens
- Build 5-tab navigation shell (Home, Scores, Create, Activity, Profile) — matches web `BottomNav`
- Build Home screen with mock feed showing Sportsphere glass-card aesthetic
- Wire to Next.js API via `packages/api-client` with configurable `EXPO_PUBLIC_API_URL`

### Phase C — Mobile Feature Parity (next)
- Auth flows (login, register, verify email)
- Profiles (player / coach / team / fan)
- Feed (posts, polls, predictions)
- Scores (matches, standings)
- Performance card + leaderboard
- Create (post composer, prediction creator)

### Phase D — Admin Split (future, optional)
- Move `/admin/*` routes into a separate Next.js app `apps/admin/`
- Keep the same Prisma client and RBAC layer
- Deploy admin on a separate domain with stricter network policies

### Phase E — Capacitor Removal (after Phase C)
- Delete `capacitor.config.ts` and `@capacitor/*` deps from `package.json`
- Remove `mobile:*` npm scripts
- Mobile is now exclusively Expo

## 9. Build & Deploy

| Client       | Build Command                                       | Output                            |
| ------------ | --------------------------------------------------- | --------------------------------- |
| Web (user)   | `npm run build`                                     | `.next/` → Node server            |
| Admin (web)  | Same as web (route-level RBAC)                      | Same `.next/` deployment          |
| Android      | `cd mobile && npx expo prebuild --platform android` then `eas build` | `.apk` / `.aab`         |
| iOS          | `cd mobile && npx expo prebuild --platform ios` then `eas build`     | `.ipa`                  |

## 10. Long-Term Vision

This architecture scales to:

```
User Ecosystem
├── Android         (Expo RN — current)
├── iOS             (Expo RN — current)
├── Web             (Next.js — current)
├── Wearables       (future — Expo RN can target Wear OS / watchOS)
└── TV/Smart TV     (future — RN for TV or separate Next.js TV app)

Admin Ecosystem
└── Web Admin       (Next.js — current, future split into apps/admin/)

Backend
├── API             (Next.js Route Handlers — current)
├── Auth            (JWT + bcrypt — current)
├── Sports Engine   (api-football integration — current)
├── Performance Engine (10-table Prisma model — current, Phases 1–9 complete)
├── Ranking Engine  (current, Phases 5–7 complete)
├── Content Engine  (posts, comments, likes — current)
├── Payment Engine  (planned)
├── Notification Engine (basic — current; push planned)
└── Analytics Engine (planned)
```

## 11. Architectural Principle

> **One Sportsphere ecosystem, multiple clients, one source of truth, centralized backend, and a completely separated administrative control plane.**

The user web app, Android app, and iOS app share:
- One database (Prisma)
- One API (Next.js Route Handlers)
- One auth system (JWT)
- One set of types (`packages/types`)
- One design language (`packages/design-system`)

The admin portal shares the same database and API but is isolated at the **authorization boundary** — only `MODERATOR` and `ADMIN` roles can reach `/admin/*` routes. No admin functionality is ever exposed to user-facing clients.

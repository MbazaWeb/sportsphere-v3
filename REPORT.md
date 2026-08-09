# Sportsphere — Status Report & Roadmap

**Date**: 2026-08-09
**Repo**: `MbazaWeb/sportsphere-v3`
**VPS**: `104.152.50.173:3002` (live)
**Status**: Backend deployed · Mobile scaffolded · Ready for Phase C

---

## 1. Architecture (Locked)

**4-client platform** sharing one backend, one identity, one design language:

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED BACKEND                            │
│   Next.js 16 · PostgreSQL · Prisma · PM2 (port 3002)        │
│   basePath: /sportsphere · 70+ routes · 50 DB tables        │
└─────────────────────────────────────────────────────────────┘
       ▲              ▲                ▲                ▲
       │              │                │                │
┌──────┴──────┐ ┌─────┴─────┐ ┌────────┴────────┐ ┌─────┴─────┐
│ Android     │ │ iOS       │ │ Web (user)      │ │ Admin Web │
│ Expo RN     │ │ Expo RN   │ │ Next.js         │ │ Next.js   │
│ SDK 52      │ │ SDK 52    │ │ /sportsphere/*  │ │ /admin/*  │
│ NativeWind  │ │ NativeWind│ │ Tailwind v4     │ │ RBAC      │
└─────────────┘ └───────────┘ └─────────────────┘ └───────────┘
```

**Shared monorepo packages**:
- `@sportsphere/design-system` — platform-agnostic brand tokens (colors, gradients, radii, typography, shadows) + Tailwind preset
- `@sportsphere/types` — TypeScript types for auth, user, performance, ranking, feed
- `@sportsphere/api-client` — typed fetch wrapper with JWT/cookie auth, used by both web and mobile

---

## 2. Backend — Performance Engine (Phases 1-9)

| Phase | What shipped | Status |
|---|---|---|
| Phase 1-2 | Core schema (User, Post, Follow, Comment, Poll, Prediction, Community, Match, Notification) | ✅ Live |
| Phase 3 | Custom role profiles (Scout, Journalist, Creator, Analyst, Commentator, Agent, Organization, Competition, League, Academy, Venue, Business, Commercial-Partner, Community) | ✅ Live |
| Phase 4 | Typed role-specific tables (17 typed profile tables: PlayerProfile, CoachProfile, TeamProfile, etc.) | ✅ Live |
| Phase 5 | Performance points + global ranking engine (PerformanceProfile, PerformanceEvent, PerformancePointTransaction, PerformanceSnapshot) | ✅ Live |
| Phase 6-7 | PerformanceCard wired into profiles + Leaderboard page | ✅ Live |
| Phase 8 | Admin KPI config UI (`/admin/kpi`) — 25 KPI configurations seeded | ✅ Live |
| Phase 9 | Event verification workflow (`/admin/verification`) with PerformanceVerification + PerformanceAnomaly tables | ✅ Live |

---

## 3. Backend — Roles & Sports Catalog

- **22 roles** seeded: Fan, Player, Coach, Team, Scout, Journalist, Creator, Analyst, Commentator, Agent, Organization, Competition, League, Academy, Venue, Business, Commercial-Partner, Community, Referee, Stadium, Medical, Developer
- **123 role types** seeded (subtypes like "Casual Fan", "Professional Player", "Head Coach")
- **20 sports** seeded: Football, Basketball, Tennis, Cricket, Rugby, Hockey, Volleyball, Handball, Baseball, Golf, Boxing, MMA, Athletics, Swimming, Cycling, Skiing, Table Tennis, Badminton, American Football, Futsal

---

## 4. Web App (Next.js 16)

**70+ routes compiled** in production build:

- **Admin**: `/admin`, `/admin/users`, `/admin/posts`, `/admin/roles`, `/admin/sports`, `/admin/performance`, `/admin/verification`
- **User**: `/`, `/leaderboard`, `/players/[id]`, full API surface
- **Auth**: JWT + session cookies, 21-role RBAC
- **Feed**: posts, polls, predictions, comments with replies + likes + @mentions
- **Profiles**: per-role custom renderers, completeness engine
- **Mobile gestures, splash, registration flow, settings, pro activation**

---

## 5. Mobile App (Expo SDK 52 + NativeWind v4)

**5 tab scaffold**:
- Home · Scores · Create · Activity · Profile
- Custom branded tab bar with gold active indicator (Reanimated spring)
- Glass card, feed card, avatar components
- API client wired to VPS via `EXPO_PUBLIC_API_URL`
- Zustand auth store with SecureStore JWT persistence
- Monorepo integration: `@sportsphere/*` packages resolved via metro watchFolders

**Brand icons generated** (navy bg `#0A1628` + gold "S" monogram `#F5C518` + orange accent dot `#FF6B35`):
- `icon.png` (1024×1024) — iOS app icon
- `adaptive-icon.png` (1024×1024) — Android adaptive icon
- `splash-icon.png` (200×200) — splash screen
- `favicon.png` (48×48) + `favicon-32.png` (32×32) — web

**Verified**:
- `npm install --legacy-peer-deps`: 962 packages, 0 errors
- `tsc --noEmit`: 0 TypeScript errors
- `expo prebuild --no-install`: success (ios/ + android/ native projects generated)
- `expo start`: server boots on port 8081, HTTP 200
- Metro bundle (Android): HTTP 200, 12.6 MB, 57s compile time, 0 errors
- API connectivity to VPS: 20 sports + 22 roles loaded live

### EAS Update Configuration

**3 branch channels** for OTA updates:

| Branch | Profile | Use | Distribution |
|---|---|---|---|
| `development` | development | Dev builds, fast iteration | Internal (your iPhone) |
| `preview` | preview | QA / staging | Internal (testers) |
| `production` | production | App Store / Play Store | Public |

Each profile bakes `EXPO_PUBLIC_API_URL=http://104.152.50.173:3002/sportsphere` into the binary.

- `app.json`: `updates.enabled=true`, `runtimeVersion.policy=appVersion`, `expo-updates` plugin
- `package.json`: `expo-updates ~0.27.0` added
- `eas.json`: 3 build profile + 3 channels + submit config

**Workflow**:
1. `eas login` (one-time)
2. `eas init` (creates project, fills `projectId` in app.json + eas.json)
3. `eas build --profile development --platform ios` (~30 min on EAS cloud)
4. Install `.ipa` on iPhone
5. Push JS-only updates: `eas update --branch development --message "fix feed rendering"`

---

## 6. Infrastructure & Deploy

- **VPS**: `104.152.50.173` (Ubuntu, Node 22, PM2, PostgreSQL)
- **Live URL**: `http://104.152.50.173:3002/sportsphere` (uptime 6h+)
- **PM2**: sportsphere process online, 0 restarts, 72 MB RAM
- **Health**: `GET /api/health` → `{"status":"healthy"}`
- **Deploy script**: `scripts/deploy-production.sh` (idempotent)
  - git pull → .env → PG setup → npm install → prisma migrate deploy → prisma db push → seeds → backfills → build → PM2 restart
- **Persistent session secret** at `/var/www/sportsphere-nextjs/.session-secret` (survives redeploys)
- **GitHub repo**: `MbazaWeb/sportsphere-v3`

---

## 7. Git History (this session)

| Commit | What |
|---|---|
| `6da9d2a` | Remove junk files (incl. Windows-invalid filename `, search, performance metrics, and demo pages"`) + fix .gitignore |
| `7cb6018` | Fix deploy script: APP_DIR → `/var/www/sportsphere-nextjs` |
| `59e259c` | Fix migration: SQLite `DATETIME` → PostgreSQL `TIMESTAMP(3)` in `0001_initial` |
| `d98259b` | Mobile: Expo SDK 52 + NativeWind v4 wired up + brand icons |
| `9077887` | EAS Update config: 3 branch channels + `expo-updates` plugin |

---

## 8. Database — Current State (Live)

**Connection**: `postgresql://sportsphere_admin:***@localhost:5432/sportsphere`
**50 tables** in `public` schema.

### Row counts by table:

| Category | Table | Rows | Notes |
|---|---|---|---|
| **Catalog** | `Role` | **22** | Seeded |
| | `RoleType` | **123** | Seeded (subtypes per role) |
| | `Sport` | **20** | Seeded |
| | `KPIConfiguration` | **25** | Phase 8 KPI config |
| **User-generated** | `User` | **0** | DB wiped during migration fix |
| | `Post` | **0** | |
| | `Comment` | **0** | |
| | `PostLike` | **0** | |
| | `Follow` | **0** | |
| | `Poll` / `PollVote` | **0** | |
| | `Prediction` | **0** | |
| | `Community` / `CommunityMember` | **0** | |
| | `Match` | **0** | |
| | `Notification` | **0** | |
| | `UserFavorite` / `UserSport` | **0** | |
| **Performance engine** | `PerformanceProfile` | **0** | Created on user registration |
| | `PerformanceEvent` | **0** | Match events feed verification |
| | `PerformancePointTransaction` | **0** | Points ledger |
| | `PerformanceSnapshot` | **0** | Daily rankings snapshot |
| | `PerformanceVerification` | **0** | Admin/coach verifications |
| | `PerformanceAnomaly` | **0** | Outlier detection |
| | `RankingCategory` / `RankingHistory` | **0** | Leaderboard buckets |
| | `LeaderboardEntry` | **0** | Materialized rank cache |
| | `KPIWeight` | **0** | Per-role KPI weight overrides |
| **Typed profiles** | `PlayerProfile` / `CoachProfile` / `TeamProfile` + 14 others | **0** | Created on registration |
| **Audit** | `AuditLog` | **0** | Admin actions log |

### Migrations applied (5):

1. `0001_initial` — core schema (fixed SQLite `DATETIME` → PG `TIMESTAMP(3)`)
2. `20260803_favorite_target_system` — polymorphic favorites
3. `20260808_comment_replies_likes` — comment threading
4. `20260809_phase4_typed_role_profiles` — 17 typed profile tables
5. `20260809_phase5_performance_engine` — performance + ranking + verification

Plus `prisma db push` synced 8 tables not in migrations (Role, RoleType, Sport, UserSport, UserFavorite, LeaderboardEntry, AuditLog, PollVote).

### Full table list (50):

```
AcademyProfile, AgentProfile, AnalystProfile, AuditLog, BusinessProfile,
CoachProfile, Comment, CommentLike, CommercialPartnerProfile,
Community, CommunityMember, CommunityProfile, CompetitionProfile,
CreatorProfile, Follow, KPIConfiguration, KPIWeight, LeagueProfile,
Match, Message, Notification, OrganizationProfile, PerformanceAnomaly,
PerformanceEvent, PerformancePointTransaction, PerformanceProfile,
PerformanceSnapshot, PerformanceVerification, PlayerProfile, Poll,
Post, PostLike, Prediction, RankingCategory, RankingHistory,
ScoutProfile, Sport, TeamProfile, User, UserFavorite, UserSport,
VenueProfile, VerificationRequest, _prisma_migrations
+ 7 additional tables synced via db push
```

---

## 9. Live Endpoints Verified

| Route | Status | Notes |
|---|---|---|
| `GET /sportsphere` | 200 | Home page |
| `GET /sportsphere/admin` | 307 | Redirect to login |
| `GET /sportsphere/admin/kpi` | 200 | Phase 8 KPI config UI |
| `GET /sportsphere/admin/verification` | 200 | Phase 9 verification UI |
| `GET /sportsphere/leaderboard` | 200 | Phase 7 |
| `GET /sportsphere/api/health` | 200 | `{"status":"healthy"}` |
| `GET /sportsphere/api/sports` | 200 | 20 sports live |
| `GET /sportsphere/api/roles` | 200 | 22 roles + types live |
| `GET /sportsphere/api/leaderboard` | 200 | Empty (no users yet) |
| `GET /sportsphere/api/admin/performance/kpi` | 401 | Correct (requires auth) |
| `GET /sportsphere/api/admin/verification/events` | 401 | Correct (requires auth) |

---

## 10. What's Next — Roadmap

### Phase C: Mobile Real Features (immediate)

Replace mock data with live VPS data:

| Screen | Mock now → Real next |
|---|---|
| **Auth** | (none) → Login + Register screens with role picker, JWT to SecureStore |
| **Home** | 3 mock posts → live `/api/feed` with pull-to-refresh, infinite scroll |
| **Scores** | Empty → live `/api/sports/*/fixtures` + `/api/standings` |
| **Create** | Empty → post composer (text/photo/poll/prediction) → `POST /api/posts` |
| **Activity** | Empty → notifications feed `/api/notifications` + `/api/activity` |
| **Profile** | Static → own profile `/api/profile` + edit + typed role profile editor |
| **Player detail** | (none) → `/players/[id]` with PerformanceCard + stats |
| **Leaderboard** | (none) → `/leaderboard` with filters (sport, region, period) |

**Effort**: 3-5 sessions. Delivers a usable mobile app end-to-end.

### Phase D: Push Notifications

- `expo-notifications` package + APNs/FCM credentials
- Server-side: Notification table → push token lookup → send
- Trigger points: new follower, comment on your post, match event verification, rank change
- Admin: broadcast tool

### Phase E: Deep Linking + Sharing

- `expo-linking` universal links (`sportsphere://player/{id}`, `https://sportsphere.app/p/{postId}`)
- OG meta tags on web for social share previews
- Share sheet integration on mobile (Share2 → native share)

### Phase F: Native Build & App Store

1. `eas build --profile production --platform ios` → `.ipa` to App Store
2. `eas build --profile production --platform android` → `.aab` to Play Store
3. App Store Connect + Play Console setup (screenshots, privacy policy, review)
4. OTA updates via `eas update --branch production` post-launch

### Phase G: Real-time Features

- WebSocket gateway (Socket.io or Ably) for live match scores, comment threads, presence
- Live leaderboard updates during matches
- Typing indicators in DMs

### Phase H: Performance Engine Activation

Currently 0 events / 0 verifications. Need to:

- Seed demo matches with PerformanceEvents
- Run `recomputeRankings()` to populate `RankingCategory` + `LeaderboardEntry`
- Set up cron for `runDailySnapshot()` + `runDailyDecay()` (points decay over time)
- Wire coach/admin verification flow on real data

### Phase I: Production Hardening

- HTTPS via Let's Encrypt + Nginx reverse proxy (currently HTTP only)
- Rate limiting on auth + post routes
- Image upload pipeline (currently Cloudinary-only)
- Backup automation (`scripts/backup-sportsphere.sh` exists, needs cron)
- Sentry for error tracking
- PostHog for product analytics

---

## 11. Recommended Next Move

**Start Phase C** — the mobile app is currently a 5-tab scaffold with mock data. Building real auth + live feed is the highest-impact next step because:

1. It validates the mobile→VPS API contract end-to-end
2. It lets you register your first real user (currently `User` count = 0)
3. It produces a demoable mobile app you can show stakeholders
4. It surfaces any remaining API issues before building more screens on top

---

## 12. Quick Reference Commands

### Deploy to VPS

```bash
ssh deploy@104.152.50.173
cd /var/www/sportsphere-nextjs
bash scripts/deploy-production.sh
```

### Run mobile locally

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start
# Scan QR with Expo Go (Android) or Camera app (iOS)
```

### EAS build + update

```bash
eas login
eas init
eas build --profile development --platform ios
# After install:
eas update --branch development --message "fix feed rendering"
```

### Check VPS health

```bash
curl http://104.152.50.173:3002/sportsphere/api/health
ssh deploy@104.152.50.173 "pm2 list"
```

### Sync local Windows PC

```bash
git fetch origin
git pull origin main
# If still hitting Windows-invalid path error:
git reset --hard origin/main
```

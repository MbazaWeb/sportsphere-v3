# Sportsphere Mobile (Flutter)

Sole native mobile client for SportSphere (Android + iOS).

Shares the **same backend, database, and APIs** as the WebApp so a Fan
sees the same posts, profile, scores, and performance data on any client.

## Architecture

```
Flutter  ──HTTP + JWT──▶  Next.js API  (/sportsphere/api/*)
                              │
WebApp   ──cookie/JWT──▶──────┤
                              ▼
                         PostgreSQL (Prisma)
```

- **Auth**: Login returns JWT in JSON body → stored in `flutter_secure_storage`
- **Requests**: `Authorization: Bearer <token>`
- **Backend** accepts both cookie (web) and Bearer (mobile)

## API base URL

Default (production):

```
https://sportssphere.fun/sportsphere/api
```

Override for testing against the VPS directly:

```bash
flutter run \
  --dart-define=API_BASE_URL=http://104.152.50.173:3002 \
  --dart-define=API_BASE_PATH=/sportsphere
```

Config lives in `lib/core/constants/api_config.dart`.

## Key files

| Path | Role |
|------|------|
| `lib/core/constants/api_config.dart` | Base URL / path |
| `lib/core/network/api_client.dart` | HTTP + Bearer + errors |
| `lib/core/storage/token_storage.dart` | Secure JWT storage |
| `lib/features/auth/data/auth_api.dart` | Login / register / me / logout |
| `lib/features/home/data/feed_api.dart` | Feed, matches, standings, polls |
| `lib/features/profile/data/profile_api.dart` | Profile update |
| `lib/core/providers/app_providers.dart` | Riverpod wiring + auth hydrate |

## Implemented (live API)

- ✅ Splash
- ✅ Auth: Login, Register, Forgot/Reset password
- ✅ Home feed (Sportlights / Following / Trending / Predictions / Polls) with infinite scroll
- ✅ Scores (matches + standings)
- ✅ Profile (view / edit / role upgrade)
- ✅ Activity, notifications, search, messages (API-backed)
- ✅ Secure token storage + auto-hydrate on launch
- ✅ Biometric lock (optional)

## Run

```bash
cd Flutter
flutter pub get
flutter run                 # device / emulator
flutter run -d chrome       # web (CORS may block localhost)
```

## Design system

- Background `#0A1628`, gold `#F5C518`, accent `#FF6B35`
- Typography: Outfit + Inter
- Glass cards, bottom nav — aligned with WebApp brand tokens

## Notes

- Native mobile does **not** need CORS (only Flutter web does).
- Push notifications: Firebase Messaging is in `pubspec.yaml` (wire-up is separate).
- Always prefer the shared API — never write a second database from mobile.

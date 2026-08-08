# Sportsphere Mobile

True-native **Android + iOS** client for Sportsphere, built with Expo + React Native.

> This app is part of the Sportsphere monorepo. See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) for the full platform architecture.

## Status

**Phase B — Mobile Bootstrap.** The app shell is in place with:

- Expo Router v4 (file-based routing, same mental model as Next.js)
- 5-tab navigation matching the web `BottomNav`: Home, Scores, Create, Activity, Profile
- Branded components: `GlassCard`, `Header`, `Avatar`, `FeedCard`, `SportsphereTabBar`
- Sportsphere brand identity (dark navy + gold + glassmorphism) via `@sportsphere/design-system`
- NativeWind v4 (Tailwind syntax on RN) with the shared Tailwind preset
- Reanimated v3 spring animations
- Outfit + Inter fonts via `expo-google-fonts`
- API client wired to the Next.js backend via `@sportsphere/api-client` (configurable via `EXPO_PUBLIC_API_URL`)
- JWT storage in `expo-secure-store`
- Mock feed on Home screen — real feed wire-up is Phase C

## Setup

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Point the app at your running Next.js API

Create `.env` in this folder:

```bash
# For Android emulator: use 10.0.2.2 (special alias to host's localhost)
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# For iOS simulator: localhost works
# EXPO_PUBLIC_API_URL=http://localhost:3000

# For a physical device: use your dev machine's LAN IP
# EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
```

### 3. Start the dev server

```bash
npm run dev
```

Then press:
- `a` to launch on Android emulator
- `i` to launch on iOS simulator
- `w` to launch in web browser (for quick visual checks)

## Build for production

### Android (.apk / .aab)

```bash
# Option A: EAS Build (cloud, recommended)
npm install -g eas-cli
eas login
eas build:setup
eas build --platform android

# Option B: Local build
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
# → output at android/app/build/outputs/apk/release/app-release.apk
```

### iOS (.ipa)

```bash
# Requires macOS + Xcode
npx expo prebuild --platform ios
# Open ios/*.xcworkspace in Xcode and archive, or:
eas build --platform ios
```

## Structure

```
mobile/
├── app/                        # Expo Router (file-based routes)
│   ├── _layout.tsx             # Root: fonts, SafeArea, StatusBar
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab navigator with SportsphereTabBar
│   │   ├── index.tsx           # Home (feed)
│   │   ├── scores.tsx          # Scores (Phase C)
│   │   ├── create.tsx          # Create (Phase C)
│   │   ├── activity.tsx        # Activity (Phase C)
│   │   └── profile.tsx         # Profile (Phase C)
│   └── +not-found.tsx
│
├── components/
│   ├── SportsphereTabBar.tsx   # Custom branded bottom tab bar
│   ├── GlassCard.tsx           # Translucent white-on-navy card surface
│   ├── Header.tsx              # Top app bar with wordmark + actions
│   ├── Avatar.tsx              # Circular avatar (expo-image)
│   └── FeedCard.tsx            # Post card (author + content + actions)
│
├── lib/
│   ├── api.ts                  # API client instance (reads EXPO_PUBLIC_API_URL)
│   └── authStore.ts            # Zustand auth store (mirrors web authStore)
│
├── assets/                     # App icon, splash, adaptive icon (place PNGs here)
├── app.json                    # Expo config (slug, splash, plugins)
├── metro.config.js             # Monorepo: lets Metro resolve @sportsphere/*
├── babel.config.js             # NativeWind + Reanimated plugins
├── tailwind.config.js          # Inherits preset from @sportsphere/design-system
├── global.css                  # NativeWind entry
├── tsconfig.json               # Path aliases for @sportsphere/* packages
└── package.json
```

## Sharing code with the web app

The mobile app imports three shared packages from `../packages/`:

| Package                       | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `@sportsphere/design-system`  | Brand tokens (colors, type, spacing) + Tailwind preset        |
| `@sportsphere/types`          | All shared TS types (User, Performance, Feed, Ranking, etc.)  |
| `@sportsphere/api-client`     | Typed fetch wrapper around the Next.js Route Handlers         |

Because these packages are pure TypeScript with no platform-specific imports, they work identically on web and RN. The mobile `metro.config.js` is configured to follow symlinks/watch the workspace root so changes to shared packages hot-reload in the mobile dev server.

## What's next (Phase C)

- [ ] Auth screens (login, register, verify email, forgot password)
- [ ] Real feed wire-up via `feedApi.list()` with TanStack Query
- [ ] Player / Coach / Team profile screens with role-aware tabs
- [ ] Scores (fixtures, standings, match details)
- [ ] Performance card + tier progress
- [ ] Leaderboard with category tabs (Overall / Form / Improvement / Consistency)
- [ ] Create flows (post composer, prediction creator, poll creator)
- [ ] Push notifications via Expo Notifications
- [ ] Haptic feedback on actions (expo-haptics)
- [ ] App icon + splash assets (currently placeholders)

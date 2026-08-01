# SportSphere - Setup & Mobile Build Guide

## Project Overview
SportSphere is a sports-focused social network web app built with:
- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4** (OLED dark theme)
- **Zustand** (state management)
- **Framer Motion** (animations)
- **Capacitor** (iOS/Android native builds)
- **PWA** (Progressive Web App)

---

## Quick Start (Web)

### Prerequisites
- Node.js 18+ or Bun
- npm or Bun

### 1. Install Dependencies
```bash
npm install
# or: bun install
```

### 2. Run Development Server
```bash
npm run dev
# or: bun run dev
```

### 3. Open in Browser
```
http://localhost:3000
```

### 4. Build for Production
```bash
npm run build
# or: bun run build
```

---

## Mobile Build (iOS & Android)

### Prerequisites
- Node.js 18+
- Android Studio (for Android) or Xcode (for iOS)
- CocoaPods (for iOS: `sudo gem install cocoapods`)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build the Web App
```bash
npm run build
```

### Step 3: Add Mobile Platforms

**Android:**
```bash
npx cap add android
```

**iOS:**
```bash
npx cap add ios
```

### Step 4: Sync Web Assets to Native
```bash
npx cap sync
```

### Step 5: Open in IDE

**Android:**
```bash
npx cap open android
```
Then in Android Studio: Build > Build APK or Run on device.

**iOS:**
```bash
npx cap open ios
```
Then in Xcode: Select your team, build and run on simulator or device.

### One-Command Mobile Run
```bash
# Android
npm run mobile:run:android

# iOS
npm run mobile:run:ios
```

---

## PWA (Progressive Web App)

The app is a full PWA. When deployed, users can:
- **Install to Home Screen** on Android/iOS
- **Work Offline** with cached content
- **Receive Push Notifications** (when configured)

No extra setup needed — the service worker registers automatically.

---

## Project Structure

```
src/
├── app/
│   ├── globals.css          # OLED dark theme
│   ├── layout.tsx           # Root layout with PWA meta
│   ├── page.tsx             # Main page (tabs, modals, overlays)
│   └── api/route.ts         # API endpoint
├── components/
│   ├── home/HomeTab.tsx     # Home feed (For You, Trending, Spotlight)
│   ├── scores/ScoresTab.tsx # Live scores, fixtures, standings
│   ├── create/CreateTab.tsx  # Content creation
│   ├── activity/ActivityTab.tsx # Notifications & messages
│   ├── profile/ProfileTab.tsx   # User profile with registration
│   ├── profiles/
│   │   ├── profileConfig.ts     # 17 profile type definitions
│   │   ├── ProfileExplorer.tsx  # Browse all profile types
│   │   ├── ProfilePage.tsx      # Profile detail view
│   │   ├── ProfileHeader.tsx    # Unified profile header
│   │   ├── ProfileTabs.tsx      # Scrollable tab bar
│   │   ├── TabContent.tsx       # Tab content renderer
│   │   └── UserProfileViewer.tsx # Click user → view profile
│   ├── registration/
│   │   ├── RegistrationModal.tsx # Fan & Advanced registration
│   │   └── RoleForms.tsx        # Role-specific forms (13 types)
│   ├── layout/
│   │   ├── BottomNav.tsx        # 5-tab bottom navigation
│   │   └── PageContainer.tsx    # Page wrapper with transitions
│   └── ui/                     # shadcn/ui components
├── hooks/
│   ├── use-mobile.ts
│   ├── use-toast.ts
│   └── useServiceWorker.ts     # PWA service worker registration
├── lib/
│   ├── db.ts
│   └── utils.ts
└── store/
    └── useAppStore.ts         # Zustand global state

public/
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker
├── icons/                    # App icons (SVG)
├── logo.svg
└── robots.txt

capacitor.config.ts          # Capacitor native config
```

---

## App Features

### Registration System
- **Fan Registration** — Quick sign up, pick sports, start following
- **Advanced Registration** — 13 roles (Team, Player, Coach, Referee, Journalist, Analyst, Creator, Scout, Stadium, Academy, Community, Organization, Business)
- **Admin Verification** — Verified badge system with pending/approved/rejected states

### 17 Profile Types
Team, Competition, Match, Player, Coach, Stadium, Venue, Academy, Community, Organization, Business, Journalist, Analyst, Creator, Scout, Referee, Fan

### Bottom Navigation
- **Home** — For You, Trending, Spotlight
- **Scores** — Live, Today, Upcoming, Results, Standings
- **Create** — Post, Photo, Video, Spotlight, Poll, Prediction
- **Activity** — All, Social, Sports, Messages
- **Profile** — Posts, Media, Spotlight + Settings

### Clickable User Profiles
Tap any user's avatar/name in posts, spotlight, or messages to open their profile overlay.

---

## Capacitor Configuration

The `capacitor.config.ts` is already configured:
- **App ID**: `com.sportsphere.app`
- **App Name**: `SportSphere`
- **Theme**: Dark (black background, green accents)
- **Status Bar**: Dark style
- **Orientation**: Portrait

For App Store / Play Store, update:
- `appId` in `capacitor.config.ts`
- App icons and splash screens (use `@capacitor/assets` tool)
- App signing credentials in respective IDEs

---

## Customizing

### Theme Colors
Edit `src/app/globals.css`:
```css
:root {
  --sport-green: #00c853;       /* Primary accent */
  --surface: #111113;           /* Card backgrounds */
  --surface-elevated: #1c1c1e; /* Elevated surfaces */
  --surface-border: #2c2c2e;   /* Borders */
}
```

### Adding New Profile Types
Edit `src/components/profiles/profileConfig.ts` and add a new entry following the unified philosophy pattern.

---

## Troubleshooting

**Build fails:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**Capacitor sync issues:**
```bash
npx cap sync --force
```

**Android build error:**
- Ensure you have Android SDK 33+ installed
- Run `cd android && ./gradlew clean`

**iOS build error:**
- Run `cd ios && pod install`
- Clean build in Xcode (Cmd+Shift+K)

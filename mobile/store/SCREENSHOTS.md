# App Store & Play Store — Screenshots Specification

This document specifies every screenshot required for App Store Connect and Google Play Console submission. Generate them with `expo-optimize` or capture manually on a real device / simulator and resize.

## Required Devices

### App Store (iOS)
| Device | Diagonal | Portrait Dimensions | Required? |
|---|---|---|---|
| iPhone 6.7" (15 Pro Max) | 6.7" | 1290 × 2796 px | ✅ Required |
| iPhone 6.5" (11 Pro Max) | 6.5" | 1242 × 2688 px | ✅ Required (or 6.7") |
| iPhone 5.5" (8 Plus) | 5.5" | 1242 × 2208 px | ✅ Required |
| iPad 12.9" (6th gen) | 12.9" | 2048 × 2732 px | ✅ Required if iPad supported |

### Google Play (Android)
| Device | Dimensions | Required? |
|---|---|---|
| Phone | 1080 × 1920 px (or 16:9 ratio) | ✅ Min 2, max 8 |
| 7" Tablet | 1080 × 1920 px | Optional |
| 10" Tablet | 1080 × 1920 px | Optional |

> **Note:** Sportsphere is portrait-only (`orientation: "portrait"` in `app.json`). All screenshots must be portrait orientation.

## Screenshots to Capture (10 total)

### 1. Login / Welcome
- **Screen:** `(auth)/login` with brand block visible
- **Caption:** "Create your free account in 30 seconds"
- **File:** `01-login.png`

### 2. Home Feed — For You
- **Screen:** `(tabs)/index` with "For You" chip active and 3+ feed cards visible
- **Caption:** "Personalised feed from players, coaches, scouts & fans"
- **File:** `02-feed-for-you.png`

### 3. Home Feed — Trending
- **Screen:** `(tabs)/index` with "Trending" chip active
- **Caption:** "Trending posts, predictions & polls across 22 roles"
- **File:** `03-feed-trending.png`

### 4. Scores Tab
- **Screen:** `(tabs)/scores` showing 8+ sport tiles with category badges
- **Caption:** "Live scores across 20 sports — football to futsal"
- **File:** `04-scores.png`

### 5. Create Post
- **Screen:** `(tabs)/create` with text typed, post type picker visible, breaking news toggle on
- **Caption:** "Compose posts, predictions, polls & highlights"
- **File:** `05-create.png`

### 6. Activity Feed
- **Screen:** `(tabs)/activity` with 4+ notifications (follow / like / comment / rank change)
- **Caption:** "Likes, mentions, follows & rank changes — in one place"
- **File:** `06-activity.png`

### 7. Own Profile
- **Screen:** `(tabs)/profile` with avatar, role badge, stats, sports chips visible
- **Caption:** "Your profile — role, sports, stats & Performance Card"
- **File:** `07-profile.png`

### 8. Leaderboard Modal
- **Screen:** `/leaderboard` modal with Overall chip + top-3 gold/silver/bronze visible
- **Caption:** "Global leaderboard with tier badges & rank movement"
- **File:** `08-leaderboard.png`

### 9. Player Detail + Performance Card
- **Screen:** `/player/[id]` with Performance Card (tier, rank, points, form) + recent events ledger visible
- **Caption:** "Player profiles with tier, rank, form & event ledger"
- **File:** `09-player-detail.png`

### 10. Register / Sport Picker
- **Screen:** `(auth)/register` with name/email/handle filled + 3 favourite sports selected
- **Caption:** "Pick your favourite sports. Get a personalised feed."
- **File:** `10-register.png`

## App Store Promotional Text (170 chars max)

```
Climb the global fan leaderboard. Predict match outcomes. Poll the community. Spotlight your highlights.
```

## Google Play Promo Text (80 chars max)

```
Climb the global fan leaderboard. Predict. Poll. Spotlight.
```

## How to Generate Screenshots

### Option A: Manual capture on a real device

```bash
# iOS — iPhone with iOS 17+
# 1. Install the development build:
eas build --profile development --platform ios
# 2. Open in Xcode → Window → Devices and Simulators
# 3. Take screenshots via Xcode or Cmd+Shift+4 on the simulator
# 4. Resize to required dimensions via:
sips -z 2796 1290 screenshot.png  # for iPhone 6.7"
```

### Option B: Manual capture on simulator

```bash
# Boot the iPhone 15 Pro Max simulator
xcrun simctl boot "iPhone 15 Pro Max"
xcrun simctl io "iPhone 15 Pro Max" screenshot ~/Desktop/01-login.png
```

### Option C: Fastlane snapshot (automated, requires Xcode UI tests)

```bash
gem install fastlane
fastlane snapshot --devices "iPhone 15 Pro Max" --languages "en-US"
# Output: ./fastlane/screenshots/en-US/
```

## File Naming Convention

```
mobile/store/screenshots/
├── ios/
│   ├── iphone-67/        # 1290 × 2796
│   │   ├── 01-Login.png
│   │   ├── 02-Feed-For-You.png
│   │   └── ...
│   ├── iphone-65/        # 1242 × 2688
│   └── ipad-129/         # 2048 × 2732
└── android/
    └── phone/            # 1080 × 1920
        ├── 01-Login.png
        └── ...
```

## Storage & Upload

- **App Store Connect:** upload screenshots directly via the web UI at `appstoreconnect.apple.com` → My Apps → Sportsphere → Screenshots.
- **Google Play Console:** upload via `play.google.com/console` → Sportsphere → Grow → Store presence → Main store listing → Screenshots.

## Captions for App Store (forced to 30 chars max each)

Apple requires captions to be short — keep each under 30 characters:

1. `Sign in or create an account`  → 29 chars
2. `Your personalised sports feed`   → 29 chars
3. `Trending across 22 role types`   → 29 chars
4. `Live scores from 20 sports`      → 27 chars
5. `Post, predict, poll, spotlight`  → 30 chars
6. `All your activity in one place`  → 30 chars
7. `Your role, sports, and stats`    → 28 chars
8. `Climb the global leaderboard`    → 28 chars
9. `Player tiers, ranks & events`    → 29 chars
10. `Pick your favourite sports`      → 26 chars

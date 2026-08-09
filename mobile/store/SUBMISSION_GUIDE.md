# Sportsphere — App Store & Play Store Submission Guide

This document walks through every step from a clean checkout to a published app on the App Store and Google Play. **Read this end-to-end before running the first build.**

## 0. Prerequisites (one-time setup)

### 0.1 Apple Developer Program
- Enrol at `developer.apple.com/programs` ($99 / year).
- Invite the submitting user to App Store Connect with **Admin** or **App Manager** role.
- Note the **Apple Team ID** (e.g. `ABCDE12345`) — visible at `developer.apple.com/account` → Membership.

### 0.2 Google Play Console
- Enrol at `play.google.com/console` ($25 one-time).
- Create the app: **Sportsphere**, package `com.sportsphere.app`.
- Generate a **service account key**: Play Console → Setup → API access → Create service account → Download JSON → save as `mobile/store/google-service-account-key.json`.

### 0.3 Expo Application Services (EAS)
```bash
npm install -g eas-cli
eas login   # use your Expo account
eas init    # creates project; writes projectId to app.json + eas.json
```
Replace `your-project-id` in `app.json` and `eas.json` with the actual project ID returned by `eas init`.

### 0.4 App Store Connect API Key (recommended for automated submit)
- `appstoreconnect.apple.com` → Users and Access → Integrations → App Store Connect API → Generate API Key.
- Roles: **App Manager**.
- Download the `.p8` file → save as `mobile/store/AuthKey_<KEY_ID>.p8`.
- Note **Issuer ID** and **Key ID** — fill them into `eas.json` `submit.production.ios`.

### 0.5 Replace all placeholders
Files containing placeholders you must fill before submitting:

| File | Placeholder | Replace with |
|---|---|---|
| `mobile/app.json` | `your-project-id` (×2) | EAS project ID |
| `mobile/eas.json` | `your-project-id` (×1) | EAS project ID |
| `mobile/eas.json` | `your-apple-id@email.com` | Apple ID email |
| `mobile/eas.json` | `your-app-store-connect-app-id` | App Store Connect numeric app ID |
| `mobile/eas.json` | `your-apple-team-id` | Apple Team ID |
| `mobile/eas.json` | `<KEY_ID>` | App Store Connect API Key ID |
| `mobile/eas.json` | `<ISSUER_ID>` | App Store Connect API Issuer ID |

## 1. Production Build — iOS

### 1.1 Build the .ipa

```bash
cd mobile
eas build --profile production --platform ios
```

- **Duration:** ~25–40 minutes on EAS cloud (m-medium resource class).
- **Output:** `build/Sportsphere.ipa` (also downloadable from the EAS dashboard).
- **Auto-increment:** `eas.json` has `autoIncrement: true` — build number bumps on each build. Version stays at `1.0.0` from `app.json`.

### 1.2 Submit to App Store Connect

```bash
eas submit --platform ios --profile production
```

- Uploads the .ipa to App Store Connect under your App ID.
- **Status after upload:** "Waiting for Review" once you complete the listing in App Store Connect.

### 1.3 Complete the App Store Connect listing

Log in to `appstoreconnect.apple.com` → My Apps → Sportsphere. Complete the following tabs:

| Tab | Required items |
|---|---|
| **App Information** | Name, Subtitle, Primary Category (SPORTS), Secondary Category (Social Networking), Content Rights, Age Rating, URL, Privacy Policy URL |
| **Screenshots** | 10 screenshots per required device (iPhone 6.7", 6.5", 5.5", iPad 12.9"). See `store/SCREENSHOTS.md` |
| **App Preview** | Optional 15-30 sec video per device |
| **Description** | Copy from `store/listings/en-US.json` → `apple.description` |
| **Keywords** | Copy from `store/listings/en-US.json` → `apple.keywords` (max 100 chars) |
| **Support URL** | `https://sportsphere.app/support` |
| **Marketing URL** | `https://sportsphere.app` |
| **Privacy Policy URL** | `https://sportsphere.app/privacy` (host the content from `store/privacy-policy.md`) |
| **App Review Information** | Demo account credentials, contact info, notes to reviewer |
| **Version Release** | Manual (you control when it goes live) or Automatic |
| **Pricing & Availability** | Free, available in all countries |
| **App Privacy** | Fill the "Data Types" form based on `store/privacy-policy.md` |

### 1.4 Submit for Review

- Click **"Add for Review"** in the version tab.
- Expect 24–48 hours for first review. Common rejection reasons:
  - Missing demo credentials — supply a Fan account email/password in App Review Information.
  - Login via third-party (we don't have any, so no issue).
  - Mention of other platforms in screenshots/description (avoid "Android" in App Store copy).
  - Missing Privacy Policy "Data Types" form.

## 2. Production Build — Android

### 2.1 Build the .aab

```bash
cd mobile
eas build --profile production --platform android
```

- **Duration:** ~15–25 minutes on EAS cloud.
- **Output:** `build/Sportsphere.aab` (Android App Bundle, required by Play Store).

### 2.2 Submit to Google Play Console

```bash
eas submit --platform android --profile production
```

- Uploads the .aab to the **production** track (configured in `eas.json`).
- For first submission, you must complete the **Store Listing** in Play Console before the upload will be accepted.

### 2.3 Complete the Play Console listing

Log in to `play.google.com/console` → Sportsphere. Complete:

| Section | Required items |
|---|---|
| **Main store listing** | App name, Short description (80 chars), Full description (4000 chars), Icon (512×512 png), Feature graphic (1024×500 png), Screenshots (min 2, max 8) |
| **Store listing** | App category (SPORTS), Tags, Privacy Policy URL |
| **Content rating** | Fill the IARC questionnaire — answer truthfully; Sportsphere should land at "Everyone" |
| **Target audience** | Select 13+ for App Store parity |
| **News app** | No |
| **Data safety** | Fill based on `store/privacy-policy.md` |
| **Government apps** | No |
| **Financial features** | No |
| **Ads** | No |
| **App access** | No |
| **Ads** | No |
| **Privacy Policy** | URL: `https://sportsphere.app/privacy` |

### 2.4 Submit for Review

- **Production track → Create release → Review release → Start rollout to Production.**
- First submission: expect 1–3 days review.
- Use **Internal testing** track first to validate the .aab installs on real devices before going to production.

## 3. OTA Updates (post-launch)

Once the binary is live, you can ship JS-only updates without re-submitting to the stores:

### 3.1 Make a JS-only change

Edit code in `mobile/app/**`, `mobile/components/**`, or `mobile/lib/**`. Do NOT touch:
- `mobile/app.json` (requires new binary)
- Native modules or `app.json` plugins (requires new binary)
- `expo-sdk` version (requires new binary)

### 3.2 Push the update

```bash
cd mobile
eas update --branch production --message "Fix: feed rendering on iOS 17.4"
```

- **Live in:** 5–15 minutes ( propagation to CDN).
- **Trigger:** the app checks for updates on `ON_LOAD` (configured in `app.json` → `updates.checkAutomatically`).
- **Rollback:** re-run `eas update` with the previous commit checked out.

### 3.3 Channel mapping

| Branch | Binary | Use |
|---|---|---|
| `development` | development build | Local dev, fast iteration |
| `preview` | preview build | QA / staging |
| `production` | production build | App Store + Play Store binaries |

## 4. Versioning Strategy

| Version component | Where | When to bump |
|---|---|---|
| `version` (e.g. `1.0.0`) | `mobile/app.json` → `expo.version` | Every release that ships to stores |
| iOS `buildNumber` | `mobile/app.json` → `ios.buildNumber` | Every TestFlight / App Store upload |
| Android `versionCode` | `mobile/app.json` → `android.versionCode` | Every Play Console upload |
| Build number (EAS) | `eas.json` `autoIncrement` | Automatic, do not touch |

**Example bump for v1.1.0:**
```bash
# Edit mobile/app.json
#   "version": "1.1.0"
#   ios.buildNumber: "2"
#   android.versionCode: 2
git commit -am "Release v1.1.0"
git tag v1.1.0
git push origin main --tags
eas build --profile production --platform ios
eas build --profile production --platform android
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## 5. Release Checklist

Use this checklist for every production release. The `mobile/scripts/release.sh` script automates most of it.

### Pre-build
- [ ] All TypeScript compiles: `npm run typecheck` → 0 errors
- [ ] No `console.log` left in production code
- [ ] `EXPO_PUBLIC_API_URL` in `eas.json` production profile points to HTTPS endpoint
- [ ] All placeholder values in `app.json` / `eas.json` replaced
- [ ] Privacy Policy and Terms of Service pages live at `sportsphere.app/privacy` and `/terms`
- [ ] App Review demo account credentials ready (a Fan account email/password)
- [ ] Screenshots captured for all required devices (see `store/SCREENSHOTS.md`)
- [ ] Store listing metadata in `store/listings/en-US.json` reviewed by marketing

### Build
- [ ] `eas build --profile production --platform ios` succeeds
- [ ] `eas build --profile production --platform android` succeeds
- [ ] Both .ipa and .aab download without errors
- [ ] Install .ipa on a real iPhone via Xcode → Devices → install (smoke test: app launches, login works, feed loads)
- [ ] Install .aab on a real Android device via `bundletool` (smoke test same as iOS)

### Submit
- [ ] `eas submit --platform ios --profile production` succeeds
- [ ] `eas submit --platform android --profile production` succeeds
- [ ] App Store Connect listing complete (all tabs in §1.3)
- [ ] Play Console listing complete (all sections in §2.3)
- [ ] Submitted to App Store review
- [ ] Submitted to Play Console production track

### Post-launch
- [ ] First OTA update tested on `production` channel
- [ ] Crash reports monitored (Sentry or EAS crashlytics) for first 72 hours
- [ ] User feedback channel (support email) monitored
- [ ] Store reviews responded to within 48 hours

## 6. Troubleshooting

### "Build failed: Cannot find module X"
- Run `npm install --legacy-peer-deps` in `mobile/` and in the workspace root.

### iOS: "No profiles for 'com.sportsphere.app' were found"
- Run `eas credentials` to let EAS manage your iOS credentials, or generate a new provisioning profile in the Apple Developer portal.

### Android: "You need to accept the Play Console license agreement"
- Log in to `play.google.com/console` once with the service account email and accept the license.

### OTA update not appearing on devices
- Verify the channel matches: `eas update --branch production` targets the production binary only.
- Verify `runtimeVersion.policy` in `app.json` is `appVersion` — OTA updates only deliver to binaries with the same `expo.version`.
- Force a check by killing and reopening the app.

### App rejected: "Login with third-party required"
- Sportsphere uses email/handle + password only — no third-party login. Add a note in App Review Information clarifying this if Apple asks.

### App rejected: "Account deletion missing"
- App Store requires a way to delete the account from within the app. Currently the Profile screen has **Logout** but not **Delete account** — add a Delete Account flow before submitting if Apple rejects.

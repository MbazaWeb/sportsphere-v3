# Firebase setup (SportSphere Flutter)

Project: **sportsphere-v1**

## One-time configure (required on a machine with Google login)

```bash
cd Flutter
dart pub global activate flutterfire_cli
# Login if needed:
#   firebase login
flutterfire configure --project=sportsphere-v1
```

This will:
- Overwrite `lib/firebase_options.dart` with real keys
- Write `android/app/google-services.json`
- Write `ios/Runner/GoogleService-Info.plist` (if iOS selected)

## Already wired in the repo

- `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)` in `lib/main.dart`
- Android Google Services Gradle plugin
- `PushService` (FCM) registers device token with backend after login
- `POST_NOTIFICATIONS` permission in AndroidManifest

## After configure

```bash
flutter pub get
flutter run
```

## Backend

Push tokens are registered via the existing API (`PushApi` / `PushService.onLogin`).
Ensure the VPS backend stores tokens and sends via FCM (or Expo/FCM server key).

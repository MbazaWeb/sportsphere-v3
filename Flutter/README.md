# Sportsphere Mobile (Flutter)

Premium sports social platform — Flutter port with **identical UI/UX** to the web app.

## Design system
- Colors: `#0A1628` background, gold `#F5C518`, accent `#FF6B35`
- Typography: Outfit (headings) + Inter (body)
- Glass cards, bottom nav, official logo SVG

## Implemented
- ✅ Splash (official logo + rotating words + progress)
- ✅ Auth: Login + Register sheets (matching web modals)
- ✅ Home feed skeleton (For You / Trending / Predictions / Polls)
- ✅ Scores tab skeleton (Matches + Standings + Live)
- ✅ BottomNav with auth gates + Login chip

## Run
```bash
flutter pub get
flutter run -d chrome
```

## Structure
```
lib/
├── theme/          AppColors, AppTypography, AppTheme
├── widgets/        GlassCard, BottomNav
├── features/
│   ├── splash/
│   ├── auth/       LoginSheet, RegisterSheet, AuthLogo
│   ├── home/       HomeTab
│   ├── scores/     ScoresTab
│   └── shell/      AppShell
└── main.dart
```

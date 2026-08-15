# SportSphere Mobile — Auth & Security

## Session model (matches API)
- Login: `POST /api/auth` with `email` **or** `handle` + `password`
- Register: `POST /api/auth/register` (password min **8**)
- Response: `{ user, token, expiresAt }`
- Mobile sends `Authorization: Bearer <token>` on subsequent requests
- Token stored in **Flutter Secure Storage** (Keystore / Keychain)
- Logout: `POST /api/auth/logout` + local token wipe
- HTTP **401** → local token cleared

## Rules
- Never log JWT values
- Never store password
- Prefer Android/iOS for auth testing (web CORS blocks localhost → production API)

## Next hardening (optional)
- Certificate pinning for production builds
- Biometric unlock for stored session
- Refresh-token rotation if API adds it

## Forgot / reset password
- `POST /api/auth/forgot-password` `{ email }` → generic message
- `POST /api/auth/reset-password` `{ token, password }` (min 8)
- UI: Login → Forgot password → optional “I have a token”

## Biometric lock
- Preference: `ss_biometric_lock_enabled`
- When enabled and a JWT exists, Face ID / fingerprint required after splash
- Toggle: Profile → Biometric lock (mobile only)

## Certificate pinning
- Leaf SHA-256 pin for `sportssphere.fun` in `lib/core/security/cert_pinning.dart`
- Applied via `HttpOverrides` on iOS/Android/desktop
- **Rotate pin** when the server TLS certificate is renewed
- Web: browser handles TLS (no Dart pin)

# Store Credentials — Local Only

This folder holds the credentials `eas submit` needs to push builds to the App Store and Play Store. **Contents are .gitignored** — see `.gitignore` in this folder.

## Files expected here

| File | How to obtain | Used by |
|---|---|---|
| `AuthKey_<KEY_ID>.p8` | App Store Connect → Users and Access → Integrations → App Store Connect API → Generate | `eas submit --platform ios --profile production` |
| `google-service-account-key.json` | Play Console → Setup → API access → Create service account → Download JSON | `eas submit --platform android --profile production` |

## Reference paths in eas.json

```jsonc
// submit.production.ios
"ascApiKeyPath": "./store/AuthKey_<KEY_ID>.p8",
"ascApiKeyId":   "<KEY_ID>",
"ascApiKeyIssuerId": "<ISSUER_ID>"

// submit.production.android
"serviceAccountKeyPath": "./store/google-service-account-key.json"
```

## Security notes

- These files grant the holder the ability to publish to the App Store and Play Store on behalf of Sportsphere. Treat them like production database credentials.
- Never commit them. The `.gitignore` in this folder blocks `AuthKey_*.p8` and `google-service-account-key.json`.
- If you suspect a credential has been exposed, revoke it immediately in the Apple / Google console and generate a new one.
- For team workflows, store credentials in a secrets manager (1Password, Vault, AWS Secrets Manager) and download them on demand rather than keeping them on disk.
